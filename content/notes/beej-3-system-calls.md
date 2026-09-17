---
title: "三：System Calls"
date: "2026-08-02"
series: "Beej's Guide 网络编程"
order: 3
tags:
  - 计算机网络
---

本节我们将介绍各类系统调用（以及其他库函数调用），借助它们，你可以调用 Unix 设备的网络功能；凡是支持sockets API 的系统（BSD、Windows、Linux、macOS 等等）也都适用。
当你调用这些函数之一时，内核会接管流程，自动完成所有底层工作。
- *大多数人在这里遇到的问题是该以什么顺序调用这些函数*（而`man` 手册在这方面没什么帮助）
    为了解决这个可怕的情况，下面的章节将按照程序中需要调用它们的顺序来介绍系统调用

### 1 getaddrinfo()
- *简单回顾一段历史*
    过去人们使用 `gethostbyname()` 完成 DNS 域名解析，之后还需要手动把解析结果填充到 `struct sockaddr_in` 结构体，再传给各类网络调用。
万幸的是，这套方式如今已经不再需要。现代编程环境中，`getaddrinfo()` 登场，它可以**一站式完成域名解析、服务名称查询，顺带把你需要的结构体全部填充完毕！**

- 函数原型：
```
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>

int getaddrinfo(const char *node,    // 例如："www.example.com" 或 IP地址
                const char *service, // 例如："http" 或是端口号
                const struct addrinfo *hints,
                struct addrinfo **res);
```
作用：你向该函数传入三个输入参数，函数会返回一条链表，`res` 指向链表首节点，承载所有查询结果
**解读参数：**
>**参数 node：**
>node = 网络节点：在互联网早期网络模型里，Node表示网络上一个独立可寻址的终端设备（主机、服务器、路由器）-> 对应含义：一台机器，用域名（www.baidu.com）或者文本 IP（180.101.49.11）标识，等价日常口语里的「主机 host」。
`<填写内容>`：待连接的主机名，也可以直接填写 IP 地址
>**参数 service：**
>service = 运行在节点上的网络服务：一台主机（node）上可以跑很多网络程序：HTTP、FTP、SSH，操作系统通过端口区分不同服务。
`<填充内容>`：可以是端口数字字符串，比如 `"80"`；也可以是服务名称（定义在 IANA 端口列表，或是 Unix 系统的 `/etc/services` 文件内，该文件保存服务名 ↔ 端口 / 协议映射），例如 `"http"`、`"ftp"`、`"telnet"`、`"smtp"` 等。
>**参数 hints：**
>hints = 参考线索：调用者给解析器提供一组偏好提示，告诉 getaddrinfo：我想要 IPv4 还是 IPv6？/我需要 TCP (SOCK_STREAM) 还是 UDP (SOCK_DGRAM)？是否生成监听地址（AI_PASSIVE）？
`<填充内容>`：指向你预先填充好信息的 `struct addrinfo` 结构体

- 下面是服务端示例：
程序需要监听本机 IP、3490 端口(注意：这段代码不会执行监听、不会初始化网络，仅仅搭建后续要用的结构体)：
```
int status;
struct addrinfo hints;
struct addrinfo *servinfo;  // 指向查询结果链表

memset(&hints, 0, sizeof hints); // 将结构体清零
hints.ai_family = AF_UNSPEC;     // IPv4、IPv6均可，不做限制
hints.ai_socktype = SOCK_STREAM; // TCP流式套接字
hints.ai_flags = AI_PASSIVE;     // 自动填充本机IP地址

if ((status = getaddrinfo(NULL, "3490", &hints, &servinfo)) != 0) {
    fprintf(stderr, "gai error: %s\n", gai_strerror(status));
    exit(1);
}

// servinfo 此时指向一条链表，包含一个或多个 addrinfo 结构体

// …执行后续所有逻辑，直到不再需要 servinfo …

freeaddrinfo(servinfo); // 释放这条链表
```
**解读代码：**
>**第6行：**
>将 `ai_family` 设置为 `AF_UNSPEC`，代表不限制协议版本，IPv4、IPv6 都接受
>**第7行：**
>标志位 AI_PASSIVE：它告诉 getaddrinfo() 将本机地址填入套接字结构体，好处是无需硬编码 IP 地址
>如果想指定特定 IP，把`getaddrinfo(NULL, "3490", &hints, &servinfo)`第一个参数 NULL 替换成目标地址字符串即可
>**第10~12行：**
>随后发起调用，一旦出错，getaddrinfo() 返回非 0 值
>我们可以借助 gai_strerror() 打印可读错误信息
>调用成功时，servinfo 指向 addrinfo 链表，链表内每个节点都封装了可用的 struct sockaddr，供后续调用使用
>**第19行：**
>最后，当我们用完 getaddrinfo() 自动分配的链表后，必须调用 freeaddrinfo() 释放内存

- 接下来是客户端示例：
想要连接服务器`www.example.net` 的 3490 端口（再次强调：代码不会真正建立连接，只是准备好后续所需结构体）：
```
int status;
struct addrinfo hints;
struct addrinfo *servinfo;  // 指向查询结果链表

memset(&hints, 0, sizeof hints); // 结构体清零
hints.ai_family = AF_UNSPEC;     // IPv4、IPv6均可
hints.ai_socktype = SOCK_STREAM; // TCP流式套接字

// 准备发起连接
status = getaddrinfo("www.example.net", "3490", &hints, &servinfo);

// servinfo 指向一条或多个 addrinfo 组成的链表

// 后续逻辑……
```

前面反复提到，`servinfo` 是一条存放各类地址信息的链表，那么我们来看一段演示小程序，打印目标域名对应的所有 IP 地址：
```
// showip.c：根据命令行传入的主机名，输出对应的IP地址
#include <stdio.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>
#include <arpa/inet.h>
#include <netinet/in.h>

int main(int argc, char *argv[])
{
    struct addrinfo hints, *res, *p;
    int status;
    char ipstr[INET6_ADDRSTRLEN];

    if (argc != 2) {
        fprintf(stderr,"usage: showip hostname\n");
        return 1;
    }

    memset(&hints, 0, sizeof hints);
    hints.ai_family = AF_UNSPEC;  // IPv4 或 IPv6 均可
    hints.ai_socktype = SOCK_STREAM;

    if ((status = getaddrinfo(argv[1], NULL, &hints, &res)) != 0) {
        fprintf(stderr, "getaddrinfo: %s\n", gai_strerror(status));
        return 2;
    }

    printf("IP addresses for %s:\n\n", argv[1]);

    for(p = res;p != NULL; p = p->ai_next) {
        void *addr;
        char *ipver;
        struct sockaddr_in *ipv4;
        struct sockaddr_in6 *ipv6;

        // 获取地址本体指针
        // IPv4 和 IPv6 的结构体字段不同：
        if (p->ai_family == AF_INET) { // IPv4
            ipv4 = (struct sockaddr_in *)p->ai_addr;
            addr = &(ipv4->sin_addr);
            ipver = "IPv4";
        } else { // IPv6
            ipv6 = (struct sockaddr_in6 *)p->ai_addr;
            addr = &(ipv6->sin6_addr);
            ipver = "IPv6";
        }

        // 将二进制IP转为字符串并打印：
        inet_ntop(p->ai_family, addr, ipstr, sizeof ipstr);
        printf("  %s: %s\n", ipver, ipstr);
    }

    freeaddrinfo(res); // 释放链表

    return 0;
}
```
**解读代码：**程序接收命令行参数传入域名，调用 `getaddrinfo()` 生成链表，随后遍历链表，打印地址信息。
>**第13~14行：**
>`status`：接收 getaddrinfo 返回值
`INET6_ADDRSTRLEN`：系统宏，定义容纳最长 IPv6 字符串的缓冲区大小（46 字节），同时兼容 IPv4 字符串
>**第16~19行：**
>运行方式：`./showip www.baidu.com` 也就是需要两个参数，如果argc == 1 代表只输入程序名，没有域名；参数不对直接打印用法并退出
>**第25~28行：**
>调用 getaddrinfo + 错误处理
>第32行开始遍历链表
>**第40~48行：**
>区分IPv4/IPv6，将基类`struct sockaddr *`强转为`struct sockaddr_in`(IP 在 .sin_addr字段)
or `struct sockaddr_in6`(IP 在 .sin6_addr字段)
>**第51行：**
`inet_ntop`：二进制 IP → 文本字符串
>最后释放链表

- 程序运行示例：
```
$ showip www.example.net
IP addresses for www.example.net:

  IPv4: 192.0.2.88

$ showip ipv6.example.com
IP addresses for ipv6.example.com:

  IPv4: 192.0.2.101
  IPv6: 2001:db8:8c00:22::171
```

- *话说回来，`getaddrinfo()`有什么用呢？*
    掌握这部分内容后，我们就可以**把 getaddrinfo()的查询结果传给其他套接字函数，最终建立网络连接**

### 2 socket() — Get the File Descriptor
**socket descriptor**：套接字描述符，属于 Unix 文件描述符的一种
- 函数原型
作用：可以指定想要创建的套接字类型（IPv4 还是 IPv6、流式套接字还是数据报套接字、TCP 还是 UDP）
```
#include <sys/types.h>
#include <sys/socket.h>

int socket(int domain, int type, int protocol);
```
**解读参数：**
>**参数domain：**
> 取值为 `PF_INET` 或 `PF_INET6`
> 历史典故：`PF_INET` 和你在填充 `struct sockaddr_in` 的 `sin_family` 字段时用到的 `AF_INET` 渊源很深，事实上二者取值完全相同，不少程序员直接把 `AF_INET` 当作第一个参数传给 `socket()`；这是因为很久以前，人们设想地址族（`AF_INET` 中 AF 的含义）或许能够支持多种协议族（`PF_INET` 中 PF 的含义）对应的协议，但这个设想最终没有落地
> 但是规范写法是：在 `struct sockaddr_in` 中使用 `AF_INET`，调用 `socket()` 时使用 `PF_INET`
> **参数type：**
> 为 `SOCK_STREAM` 或 `SOCK_DGRAM`
> **参数protocol：**
>  可以设为 0，系统会根据套接字类型自动选择合适协议
>  也可以调用 `getprotobyname()` 查询所需协议，例如 `"tcp"` 或 `"udp"

- 实际开发中，更推荐直接复用 `getaddrinfo()` 的查询结果，将参数原样传入 `socket()`，示例如下：
```
int s;
struct addrinfo hints, *res;

// 发起地址查询
// 【假设我们已经完成 hints 结构体的填充】
getaddrinfo("www.example.com", "http", &hints, &res);

// 再次提醒：你应当对 getaddrinfo() 的返回值做错误检查，
// 遍历 res 链表寻找可用节点，不要像本例一样直接默认首个节点有效。
// 客户端与服务端章节会给出规范完整示例。

s = socket(res->ai_family, res->ai_socktype, res->ai_protocol);
```
%% 命名：ai_xxx = addrinfo %%
`socket()` 调用成功会返回套接字描述符，可供后续系统调用使用：调用失败返回 `-1`，同时全局变量 `errno` 会被设置为对应的错误码

*仅有套接字本身毫无意义，还需要调用更多系统调用才能让它发挥作用*

### 3 bind() — What port am I on?
- *端口绑定的作用？*
    - 创建套接字之后，你有时需要将这个套接字绑定到本机的某个端口。
        服务端场景十分常见：如果你要调用 `listen()` 监听特定端口的接入连接，多人联机游戏服务器就是典型例子，提示玩家 “连接至 192.168.5.10:3490”
    - **内核依靠端口号，把收到的数据包分发到对应进程的套接字描述符**。
        - 理解：内核维护的是【网络地址 → socket 内核对象】映射，socket 再关联拥有它的进程
        - 查找链路：数据包端口 → 匹配socket内核对象 → socket归属的进程 → 进程可以通过fd操作socket
    - 如果你只是作为客户端调用 `connect()`，通常不需要执行绑定。

- `bind()` 系统调用原型
```
#include <sys/types.h>
#include <sys/socket.h>

int bind(int sockfd, struct sockaddr *my_addr, int addrlen);
```
**解读参数：**
>**参数sockfd：**
>socket() 返回的套接字文件描述符。
**参数my_addr**：
指向 struct sockaddr 的指针，存放本机地址信息，包含 IP 地址与端口。
>**参数addrlen：**
地址结构体占用的字节长度

- 我们来看示例代码，将套接字绑定本机的 3490 端口(**本地**)：
```
struct addrinfo hints, *res;
int sockfd;

// 先用 getaddrinfo 填充地址结构体：
memset(&hints, 0, sizeof hints);
hints.ai_family = AF_UNSPEC;        // IPv4 / IPv6 均可
hints.ai_socktype = SOCK_STREAM;
hints.ai_flags = AI_PASSIVE;        // 自动填充本机IP

getaddrinfo(NULL, "3490", &hints, &res);

// 创建套接字
sockfd = socket(res->ai_family, res->ai_socktype, res->ai_protocol);

// 绑定到传入 getaddrinfo 的端口
bind(sockfd, res->ai_addr, res->ai_addrlen);
```
流程：`getaddrinfo()`填充结构体 -> `sokect()`创建套接字 -> `bind()`使用前两个函数得到的消息绑定端口
- **相关细节：**
    - 错误处理：如果`bind()` 调用失败返回 `-1`，同时设置全局变量 `errno` 存放错误码
    - 端口范围：调用 bind() 需要留意端口范围，1024 以下端口均为保留端口（普通用户无法占用，root 用户除外），你可以选用 1024 ~ 65535 之间未被其他程序占用的端口
        - *端口范围为什么是0~65535？*
            TCP/UDP 协议头部里，源端口、目的端口字段都是16 bit -> 2^16 = 65536
    - 地址被占用：如果重启服务端时，bind() 报错：地址已被占用（Address already in use）原因是内核中还有之前连接残留的套接字占用端口，处于等待回收状态。
        可以等待一分钟左右等待内核自动清理，或者添加代码开启端口复用：
```
int yes=1;

// 消除恼人的“地址已占用”报错
setsockopt(listener, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof yes);
```
- **简要说明：**
    - `SO_REUSEADDR` 是套接字的层选项，作用是放松 bind 地址占用检查；用途：服务端重启时绕过 TIME_WAIT，消除 `Address already in use`
    - 必须在 bind 之前调用 setsockopt

- 某些场景下你并非必须调用`bind()`：
    如果你主动 `connect()` 连接远端主机，且不在乎本机使用哪个端口（例如 telnet，使用者只关心远端端口），直接调用 `connect()` 即可。
    内核会检查套接字是否未绑定，必要时自动分配一个空闲本地端口完成隐式绑定。

### 4 connect()
- 场景：我们暂且假想你是一个 telnet 程序。用户向你下达指令要求你获取一个套接字文件描述符。你遵照指令调用了`socket()`。紧接着，用户让你连接地址 “10.12.110.57” 的 23 端口（telnet 默认端口）。这时就要用到`connect()` (连接远程主机)
- `connect()`函数原型：
```
#include <sys/types.h>
#include <sys/socket.h>

int connect(int sockfd, struct sockaddr *serv_addr, int addrlen);
```
**参数说明：**
>**sockfd：**就是`socket()`调用返回的套接字文件描述符；
>**serv_addr：**是存放目标端口与 IP 地址的 `sockaddr`结构体；
>**addrlen：**代表服务端地址结构体的字节长度。

**所有这些信息都能直接从getaddrinfo()的返回结果中获取，十分方便**

- 示例代码，建立套接字连接访问`www.example.com`的 3490 端口(**远程**)：
```
struct addrinfo hints, *res;
int sockfd;

// 先用 getaddrinfo 填充地址结构体：
memset(&hints, 0, sizeof hints);
hints.ai_family = AF_UNSPEC;
hints.ai_socktype = SOCK_STREAM;

getaddrinfo("www.example.com", "3490", &hints, &res);

// 创建套接字
sockfd = socket(res->ai_family, res->ai_socktype, res->ai_protocol);

// 发起连接！
connect(sockfd, res->ai_addr, res->ai_addrlen);
```
**简要说明：**就是通过`getaddrinfo()`获取信息(返回以一条addrinfo 结构体为节点的的链表)，再通过`sokect()`(sokect对象的操作手柄)获取套接字文件描述符，然后传给`connect()`就可以实现远程连接主机
- 务必检查`connect()`的返回值：调用失败时返回`-1`，并设置`errno`变量。
- *另外注意，这段代码没有调用 `bind()`*
    本质原因是我们不关心本机使用哪个端口，只关心要访问的远端端口。
    内核会自动为本机分配端口，连接的目标服务器也能自动获取该信息，无需我们操心。

### 5 listen()
- 场景：如果你不想主动连接远端主机，而是想要等待外部接入连接并进行处理，该怎么做？
    流程分为两步：先调用 `listen()`，再调用 `accept()`

- `listen()` 函数原型：`int listen(int sockfd, int backlog);`
**参数说明：**
>**参数backlog** ：代表接入队列允许容纳的连接数量
    外部发起的连接会在这个队列中排队，直到你调用 `accept()` 接收连接，该参数就是队列最大长度。大多数系统会将该值隐性限制在 20 左右，日常设置为 5 或 10 一般就足够。

- 和其他函数一致，调用失败时 `listen()` 返回 `-1`，并设置 `errno`
- **调用 listen() 之前必须先执行 bind()，这样服务端才能绑定在确定端口上运行**
监听接入连接时，系统调用顺序如下：
```
getaddrinfo();
socket();
bind();
listen();
accept();
```

### 6 accept()
- *`accept()` 的机制有点特别！*
    流程：远端主机调用 `connect()` 尝试连接本机正在 `listen()` 的端口，这条连接会进入等待队列，等候 `accept()` 接收。
    你调用 `accept()`，告知内核取出队列里待处理的连接
        函数会返回一全新的套接字文件描述符，专门用于这条独立连接 → 现在拥有两个套接字描述符：**原先的描述符继续监听更多新连接；新生成的描述符则可以用来收发数据（send()、recv()）**
    到此，通信环节正式就绪！

- 函数原型如下：
```
#include <sys/types.h>
#include <sys/socket.h>

int accept(int sockfd, struct sockaddr *addr, socklen_t *addrlen);
```
**参数说明：**
>**sockfd：**
执行过 listen() 的监听套接字描述符(而不是用于连接的sockfd)
>**addr：**
通常指向本地定义的 struct sockaddr_storage，接入客户端的地址信息会存入此处，你可以借此获取客户端 IP 与端口。
>**addrlen：**
本地整型变量，传入 accept() 前需要赋值为 sizeof(struct sockaddr_storage)。
accept() 向 addr 写入的数据不会超过该长度；若实际写入字节更少，会修改 addrlen 的值来体现真实长度

- 出错时 `accept()` 返回 `-1`，并设置 `errno`
- 示例代码：
```
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>

#define MYPORT "3490"  // 客户端连接的目标端口
#define BACKLOG 10     // 等待连接队列最大容量

int main(void)
{
    struct sockaddr_storage their_addr;
    socklen_t addr_size;
    struct addrinfo hints, *res;
    int sockfd, new_fd;

    // !!千万记得为所有调用添加错误检查!!

    // 第一步，使用getaddrinfo填充地址结构体：
    memset(&hints, 0, sizeof hints);
    hints.ai_family = AF_UNSPEC;  // IPv4、IPv6均可
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_flags = AI_PASSIVE;     // 自动填充本机IP

    getaddrinfo(NULL, MYPORT, &hints, &res);

    // 创建套接字、绑定端口、开启监听：
    sockfd = socket(res->ai_family, res->ai_socktype, res->ai_protocol);
    bind(sockfd, res->ai_addr, res->ai_addrlen);
    listen(sockfd, BACKLOG);

    // 接收一条接入连接：
    addr_size = sizeof their_addr;
    new_fd = accept(sockfd, (struct sockaddr *)&their_addr, &addr_size);

    // 现在可以通过 new_fd 收发数据！
    ……
}
```
- 注意：所有收发操作都使用 `new_fd`(如果程序只需要处理唯一一条连接，你可以主动 `close()` 监听套接字 `sockfd`，阻止该端口接收更多客户端连接)

### 7 send() 和 recv()
- **这两个函数用于流式套接字或者已建立连接的数据报套接字的数据通信**（如果你要使用未建立连接的普通数据报套接字要用 `sendto()` 和 `recvfrom()` ）
- *这两个都是阻塞调用*
    **“阻塞到底是什么意思？” 简单讲：程序会停在这条系统调用上，直到收到数据。**
    也就是说，在数据抵达之前，`recv()` 会一直阻塞等待。
    `send()` 在发送缓冲区占满时同样会阻塞，不过这种场景相对少见
    我们后续会继续讨论阻塞，以及如何按需规避阻塞

- `send()` 函数原型：
`int send(int sockfd, const void *msg, int len, int flags);`
**参数说明：**
>**sockfd：**用于发送数据的套接字描述符（可以是 socket() 创建的描述符，也可以是 accept() 返回的新描述符）
 **msg：**指向待发送数据的指针
 **len：**数据字节长度
**常规场景直接将 标志位flags 设为 0**（更多标志位详情查阅 send() 手册页，比如flags设置为MSG_DONTWAIT可以使得本次send()变成非阻塞调用）

- 示例代码：
```
char *msg = "Beej was here!";
int len, bytes_sent;

len = strlen(msg);
bytes_sent = send(sockfd, msg, len, 0);
```
**简要说明：**
>**send() 返回实际成功发送的字节数**
>    该数值有可能小于你想要发送的数据长度：有时你传入大量数据，内核缓冲区无法一次性接收全部内容，它会尽力发送一部分，剩余的数据需要你后续继续发送。
>    请记住：如果返回值不等于传入的 len，你需要自行处理剩余数据的补发。（好在一般情况下，如果数据包较小（大约 1KB 以内），大多可以一次性全部发送）

- 函数出错时返回 -1，同时设置 errno

- `recv()`函数原型：
`int recv(int sockfd, void *buf, int len, int flags);`
**参数说明：**
>**sockfd：**待读取数据的套接字描述符；
**buf：**存放接收数据的缓冲区；
**len：**缓冲区最大可读长度；
**flags 常规置 0**（标志位详情查阅 recv() 手册页）

- `recv()` 返回成功读到缓冲区的字节数；出错返回 `-1`，并设置 `errno`。
- 注意：`recv()` 有可能返回 `0`，含义是远端正常关闭连接（TCP FIN 报文到达，优雅关闭）；返回 0 ≠ 缓冲区为空

### 8 sendto() and recvfrom() — 数据报方式通信
- *为什么无连接的数据报套接字要其特殊的系统调用*
    数据报套接字没有和远端主机建立连接，发送数据包前我们必须额外提供信息 -> 目标地址
- `sendto()`函数原型：
```
int sendto(int sockfd, const void *msg, int len, unsigned int flags, const struct sockaddr *to, socklen_t tolen);
```
**参数说明：**
>**该调用大体和 send()一致，只是新增了两个参数**
>**to：**
指向 `sockaddr`结构体的指针，，存放目标 IP 地址与端口
通常是 `sockaddr_in`、`sockaddr_in6`或者`sockaddr_storage`，使用时强制转换类型
>**tolen：**
本质为整型，直接设置成 `sizeof *to`或 `sizeof(struct sockaddr_storage)`即可

- 想要填充目标地址结构体，你可以通过`getaddrinfo()`获取、或是由下方`recvfrom()`传回，也可以手动赋值
- 和`send()`一样，`sendto()`返回实际发送的字节数（同样，该数值有可能小于你指定的发送长度）；出错时返回`-1`

- `recv()`和`recvfrom()`也十分相似。`recvfrom()`函数原型：
```
int recvfrom(int sockfd, void *buf, int len, unsigned int flags, struct sockaddr *from, int *fromlen);
```
参数说明
>**同样，它只是在recv()基础上增加了几个参数**
>**from：**
>指向本地的sockaddr_storage结构体，调用成功后，其中会填入数据包发送方的 IP 地址和端口**fromlen：**
>是本地整型变量的指针，初始化时赋值为 `sizeof *from`或 `sizeof(struct sockaddr_storage)`
>函数返回后，fromlen会保存实际存入from中的地址长度

- `recvfrom()`返回接收到的字节数；出错返回`-1`，并设置对应的`errno`错误码
- *记住：如果你对数据报套接字调用`connect()`，后续通信就可以直接使用`send()`与`recv()`*
    套接字本身依旧是数据报类型，底层仍然使用 UDP 协议，只是`connect()`后，套接字接口会自动帮你填充目标地址与源地址信息

### 9 close () 和 shutdown () — 断开连接
- *怎么关闭套接字描述符上的连接？*
    因为操纵socket对象的句柄sockfd本质就是文件描述符，所以直接使用标准 Unix 文件描述符函数 close ()：`close(sockfd);`
    返回-1表示失败，需要检查 `errno` 全局变量获取具体错误原因
*如果你想要更精细地控制套接字关闭行为，怎么办？*
    可以使用 shutdown ()
    它支持单向切断通信，或是双向切断（效果等同于 close ()）
    函数原型：`int shutdown(int sockfd, int how);`
    shutdown () 调用成功返回 0，出错返回 -1，并设置对应的错误码 errno

| how | 作用                      |
| --- | ----------------------- |
| 0   | 禁止后续接收数据                |
| 1   | 禁止后续发送数据                |
| 2   | 禁止收发双向数据（效果接近 close ()） |
- **shutdown () 不会真正关闭文件描述符，仅改变套接字的通信权限**；想要释放套接字描述符资源，必须调用 close ()

### 10 getpeername () / gethostname ()
- *getpeername () 用于获取已连接流式套接字对端的地址信息*
    函数原型：
```
#include <sys/socket.h>
int getpeername(int sockfd, struct sockaddr *addr, int *addrlen);
```
**参数：**
>`sockfd` 是已建立连接的流式套接字描述符
>`addr` 指向 sockaddr结构体，用于存放对端地址
>`addrlen` 是整型指针，调用前需要初始化为 `sizeof *addr` 或 `struct sockaddr` 的大小

拿到地址之后，你可以使用 inet_ntop ()、getnameinfo () 或 gethostbyaddr () 打印地址、获取更多信息
- *gethostname ()返回当前程序运行所在主机的名称*
    函数原型：
```
#include <unistd.h>
int gethostname(char *hostname, size_t size);
```
**参数：**
>**hostname 字符数组指针**，函数执行完成后存入主机名
>`size` 代表 hostname 缓冲区的字节长度
