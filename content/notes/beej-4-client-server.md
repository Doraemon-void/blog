---
title: "四：Client-Server Background"
date: "2026-08-04"
series: "Beej's Guide 网络编程"
order: 4
tags:
  - 计算机网络
---

### 前言
- 网络上几乎所有交互，都是客户端进程与服务器进程相互通信
客户端与服务器之间的数据交互如图所示：
![客户端与服务器之间的数据交互流程](/notes/beej/client-server-flow.png)
- 客户端与服务端可以使用 SOCK_STREAM、SOCK_DGRAM 或其他套接字类型通信（前提是双方保持一致）
- 典型的客户端 / 服务端组合有 telnet/telnetd、ftp/ftpd、火狐浏览器 / Apache 服务器。每当你使用 ftp 时，远端都会有 ftpd 程序为你提供服务
- 一台主机上通常只运行一个服务器程序，该服务器依靠fork()处理多个客户端
    基本流程：服务器等待连接 -> 调用accept()接受连接 -> 随后fork()创建子进程单独处理该连接

### 1 简易流式服务器
- 该服务器功能很简单：通过流式连接发送字符串 “Hello, world!”
服务端源码：
```
server.c
-----------
#include<...>
#define PORT "3490"  // 客户端连接使用的端口
#define BACKLOG 10   // 待处理连接队列最大数量

void sigchld_handler(int s)
{
    (void)s; // 消除未使用变量警告

    // waitpid() 可能覆盖errno，因此先保存并恢复：
    int saved_errno = errno;

    while(waitpid(-1, NULL, WNOHANG) > 0);

    errno = saved_errno;
}

// 获取sockaddr中的IP地址，兼容IPv4、IPv6：
void *get_in_addr(struct sockaddr *sa)
{
    if (sa->sa_family == AF_INET) {
        return &(((struct sockaddr_in*)sa)->sin_addr);
    }

    return &(((struct sockaddr_in6*)sa)->sin6_addr);
}

int main(void)
{
    // sockfd用于监听，new_fd用于新连接
    int sockfd, new_fd;
    struct addrinfo hints, *servinfo, *p;
    struct sockaddr_storage their_addr; // 存储客户端地址信息
    socklen_t sin_size;
    struct sigaction sa;
    int yes=1;
    char s[INET6_ADDRSTRLEN];
    int rv;

    memset(&hints, 0, sizeof hints);
    hints.ai_family = AF_INET;
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_flags = AI_PASSIVE; // 自动绑定本机IP

    if ((rv = getaddrinfo(NULL, PORT, &hints, &servinfo)) != 0) {
        fprintf(stderr, "getaddrinfo: %s\n", gai_strerror(rv));
        return 1;
    }

    // 遍历所有结果，绑定到第一个可用地址
    for(p = servinfo; p != NULL; p = p->ai_next) {
        if ((sockfd = socket(p->ai_family, p->ai_socktype,
                p->ai_protocol)) == -1) {
            perror("server: socket");
            continue;
        }

        if (setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &yes,
                sizeof(int)) == -1) {
            perror("setsockopt");
            exit(1);
        }

        if (bind(sockfd, p->ai_addr, p->ai_addrlen) == -1) {
            close(sockfd);
            perror("server: bind");
            continue;
        }

        break;
    }

    freeaddrinfo(servinfo); // 释放addrinfo链表

    if (p == NULL)  {
        fprintf(stderr, "server: failed to bind\n");
        exit(1);
    }

    if (listen(sockfd, BACKLOG) == -1) {
        perror("listen");
        exit(1);
    }

    sa.sa_handler = sigchld_handler; // 回收所有结束的子进程
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_RESTART;
    if (sigaction(SIGCHLD, &sa, NULL) == -1) {
        perror("sigaction");
        exit(1);
    }

    printf("server: waiting for connections...\n");

    while(1) {  // accept() 主循环
        sin_size = sizeof their_addr;
        new_fd = accept(sockfd, (struct sockaddr *)&their_addr,
            &sin_size);
        if (new_fd == -1) {
            perror("accept");
            continue;
        }

        inet_ntop(their_addr.ss_family,
            get_in_addr((struct sockaddr *)&their_addr),
            s, sizeof s);
        printf("server: got connection from %s\n", s);

        if (!fork()) { // 此处是子进程
            close(sockfd); // 子进程不需要监听套接字
            if (send(new_fd, "Hello, world!", 13, 0) == -1)
                perror("send");
            close(new_fd);
            exit(0);
        }
        close(new_fd);  // 父进程不再需要该连接描述符
    }

    return 0;
}
```
**代码解读：**
>**工作流程：**
>1. 创建监听 socket → bind 绑定端口 → listen 开启监听
>2. 循环 accept 接收客户端连接
>3. fork() 创建子进程单独处理每个客户端
>4. 父进程继续等待下一个连接
>5. 信号处理回收僵尸子进程，兼容 IPv4/IPv6 地址解析
>**信号处理函数 sigchld_handler** (将在main()中注册)
>作用：子进程退出时内核发送 `SIGCHLD`(Signal - Child)；若不处理会产生僵尸进程
> `waitpid(-1, NULL, WNOHANG)`：非阻塞等待任意子进程退出
> **工具函数** get_in_addr
> 作用：struct sockaddr 通用地址结构体 --> sockaddr_in(IPv4) or sockaddr_in6(IPv6)
> **第33~40行**：定义变量
> sockfd：监听套接字；new_fd：客户端连接套接字
> addrinfo：地址信息结构体
> sockaddr_storage：足够大的通用存储，兼容 ipv4/ipv6 客户端地址
> INET6_ADDRSTRLEN：保存 IP 字符串最大长度宏
> **第42~50行**：getaddrinfo 地址配置
> getaddrinfo(网络节点(域名orIP),端口,hints,结果链表)
> hints：配置查询规则
    AI_PASSIVE：服务端标志，自动填充本机地址
    SOCK_STREAM：TCP 流式套接字
>**第53~80行**：循环创建 socket、setsockopt、bind
> `setsockopt SO_REUSEADDR`：允许端口快速重启，规避 TIME_WAIT 占用端口问题
>失败则关闭 socket，尝试链表下一条地址
>成功跳出循环，并释放链表freeaddrinfo()
>链表全部遍历完毕依然 bind 失败，直接退出
>**第82~85行**：listen 开启监听
>**第87~93行**：注册 SIGCHLD 信号处理器
>**第97~104行**：主循环 accept 接收连接
>accept()阻塞等待客户端 TCP 连接
>连接到达返回新文件描述符 new_fd，专门用来和该客户端通信；而sockfd 永远只负责监听，不收发数据
>**第106~109行**：将客户端二进制地址转换成人类可读 IP 字符串并打印
>**第111~118行 - fork 多进程处理客户端**：
> `fork`：一次调用，两次返回
>     返回-1 -> 失败
>     返回0 -> 子进程
>     返回>0 -> 父进程，返回值是子进程的 PID
> `<子进程>`：
    关闭sockfd：子进程不需要监听 socket（文件描述符继承，减少引用计数）
    持有new_fd：send 发送字符串 -> 关闭连接 -> exit 退出
 `<父进程>`：
    立刻close(new_fd)：父进程不负责通信，减少 fd 引用
    连接不会断开，只要子进程持有 new_fd 有效
> **文件描述符采用引用计数，所有持有者全部 close 才会真正断开 TCP 连接**

- 测试这个服务器所需做的就是在另一个窗口中运行它，然后从另一个窗口 telnet 到它：
`$ telnet 主机名 3490`

### 2 简易流式套接字客户端
- 功能：连接命令行指定主机的 3490 端口，接收服务端发送过来的字符串
代码：
```
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <netdb.h>
#include <sys/types.h>
#include <netinet/in.h>
#include <sys/socket.h>

#include <arpa/inet.h>

#define PORT "3490" // 客户端将要连接的端口

#define MAXDATASIZE 100 // 单次最多接收字节数

// 获取 sockaddr 地址（兼容 IPv4、IPv6）
void *get_in_addr(struct sockaddr *sa)
{
    if (sa->sa_family == AF_INET) {
        return &(((struct sockaddr_in*)sa)->sin_addr);
    }

    return &(((struct sockaddr_in6*)sa)->sin6_addr);
}

int main(int argc, char *argv[])
{
    int sockfd, numbytes;
    char buf[MAXDATASIZE];
    struct addrinfo hints, *servinfo, *p;
    int rv;
    char s[INET6_ADDRSTRLEN];

    if (argc != 2) {
        fprintf(stderr,"usage: client hostname\n");
        exit(1);
    }

    memset(&hints, 0, sizeof hints);
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;

    if ((rv = getaddrinfo(argv[1], PORT, &hints, &servinfo)) != 0) {
        fprintf(stderr, "getaddrinfo: %s\n", gai_strerror(rv));
        return 1;
    }

    // 遍历所有地址结果，尝试连接第一个可用地址
    for(p = servinfo; p != NULL; p = p->ai_next) {
        if ((sockfd = socket(p->ai_family, p->ai_socktype,
                p->ai_protocol)) == -1) {
            perror("client: socket");
            continue;
        }

        inet_ntop(p->ai_family,
            get_in_addr((struct sockaddr *)p->ai_addr),
            s, sizeof s);
        printf("client: attempting connection to %s\n", s);

        if (connect(sockfd, p->ai_addr, p->ai_addrlen) == -1) {
            perror("client: connect");
            close(sockfd);
            continue;
        }

        break;
    }

    if (p == NULL) {
        fprintf(stderr, "client: failed to connect\n");
        return 2;
    }

    inet_ntop(p->ai_family,
            get_in_addr((struct sockaddr *)p->ai_addr),
            s, sizeof s);
    printf("client: connected to %s\n", s);

    freeaddrinfo(servinfo); // 地址信息结构体使用完毕，释放内存

    if ((numbytes = recv(sockfd, buf, MAXDATASIZE-1, 0)) == -1) {
        perror("recv");
        exit(1);
    }

    buf[numbytes] = '\0';

    printf("client: received '%s'\n",buf);

    close(sockfd);

    return 0;
}
```
**代码解读：**
>**执行流程：**
 >**1.校验命令行参数，程序需要 2 个参数：程序名 + 目标主机**：`if (argc != 2)`
>**2.填充 hints，调用 getaddrinfo 域名解析，得到服务端地址链**
>    `hints.ai_family = AF_UNSPEC;` -> 不限制协议
>    `hints.ai_socktype = SOCK_STREAM;` -> 指定流式套接字
>    servinfo 链表 ← `getaddrinfo(网络节点(域名/IP),端口,hints,结果链表)`
 >**3.循环遍历地址链表：socket() -> connect()**
 >循环遍历解析出来的每一个地址方案，创建 socket
 >创建失败打印错误，继续尝试下一个地址；创建成功则尝试 `connect()`，连接失败 `close(sockfd)`，尝试下一个地址
>连接成功跳出循环；全部失败则程序退出(记得freeaddrinfo(servinfo)）
>**4.recv() 读取服务端发来的数据，手动添加字符串结束符 \0**
>`recv(sockfd, buf, MAXDATASIZE-1, 0)`：连接sockect - sockfd；缓冲区指针和最大长度 - buf,MAXDARASIZE-1；标志位通常置0
>细节：网络传输的数据不带 \0，手动添加终止符，保证 printf 安全，防止缓冲区溢出乱码
>**5.打印接收内容，关闭套接字，程序结束**

- 运行方式：`./client 本机地址`
- 如果你先运行客户端、没有启动服务端，connect() 调用会返回「连接被拒绝（Connection refused）」

### 3 数据报套接字
- 场景：
    - listener 程序运行在一台主机上，持续监听 4950 端口的入站数据包
    - talker 程序向指定主机的该端口发送数据包，包内承载用户在命令行传入的文本
- 与流式套接字的区别
    数据报套接字属于无连接通信，数据包直接发往网络，不保障送达
    因此我们强制客户端与服务端统一使用 IPv6，这样就能避免一种场景：
        服务端监听 IPv6，客户端却通过 IPv4 发包，最终数据包无法被接收
        其实在面向连接的 TCP 流式套接字中，也可能出现地址族不匹配问题，但 connect() 失败后程序会自动尝试其他地址
- 代码简要描述：
    代码实现与流式套接字的示例类似，不同点如下：
    - listener.c 数据报套接字服务器
        程序不需要调用 `listen()` 或 `accept()`
        使用`recvfrom()`接受数据，需要目标地址参数(TCP不需要，因为`connect()`后，内核记住对端地址)
    - talker.c 数据报套接字客户端
        不用先启动服务端！单独运行 talker 也能正常执行，数据包会直接发往网络
        如果另一端没有程序调用 recvfrom() 接收，数据包就会直接丢失
        使用`sendto()`发送数据，需要目标地址参数
    - 已连接数据报套接字：如果talker 调用 connect() 指定 listener 的地址
        在此之后，talker 只能向该地址收发数据
        也不再需要使用 sendto() 和 recvfrom()，直接使用 send() 和 recv() 即可

### 4 Rust实现服务器-客户端
#### 4.1 TCP服务器
1. 导入依赖库
```
use std::net::{TcpListener,TcpStream};
use std::io::{Read,Write};
use std::thread;
```
**讲解：**
>**std::net：Rust 标准库网络模块**
>    TcpListener：TCP 监听器（服务端） -> 对应 C：socket() + bind() + listen()
>    TcpStream：TCP 连接流 -> 对应 C 建立连接后的 socket fd
>**`use std::io::{Read,Write}`**
>    Read：提供 .read() / .read_to_string() 等读取方法 -> 对应 C recv()
>    Write：提供 .write() / .write_all() 等写入方法 -> 对应 C send()
>    TcpStream 同时实现这两个 trait，因此可以直接收发数据(在 Rust 中，不把 trait 引入作用域，不能调用该 trait 中定义的方法)
>**use std::thread：标准线程库**
监听器每收到一条客户端连接，新建一个线程独立处理该 TcpStream，实现并发

2. 处理单个客户端连接的函数
```
fn handle_client(mut stream: TcpStream) -> std::io::Result<()> {
    //发送消息
    stream.write_all(b"Hello, world")?;
    //读取客户端数据
    let mut buf = [0;512];
    let n = stream.read(&mut buf)?;
    if n > 0 {
        println!("收到{}字节，内容为：{:?}", n, &buf[..n]);
    }

    Ok(())
}
```
**讲解：**
>**第1行：函数定义**
>传入参数
>    处理连接那么自然要传入表示连接的参数TcpStream
>    同时，读写方法接收的参数是可变引用 &mut TcpStream，所以传入参数为`mut stream: TcpStream`
>    额外一提：**mut ≠ “这个数据本身可变”，而是允许变量重绑定和取 &mut(可变借用）**
>返回值
>    `Result<()>` 的含义是：函数成功则返回空元组，要么失败返回错误信息
>    这种返回值便于处理错误
>**第3行：写入缓冲区**
>write_all：保证把全部字节写入缓冲区（而write可能只写一部分）
>b"xxx"：将"xxx"从&str转换为&\[u8\]，因为write_all接受参数 &\[u8\]
>错误传播符？：如果结果成功，取出里面的值；如果失败，立即从当前函数返回错误
>**第5~6行：读取缓冲区**
>使用512字节接收缓冲区，返回读到的字节数 n
>第7~9行：打印收到的数据
>`{:?}` 是 Rust 中的调试格式说明符，它告诉 println! 宏使用 Debug trait 来格式化并输出数据，可以打印数组、元组、结构体、Result
>&buf[..n]等价于 &buf[0..n]，我们不需要打印完整数组(可能有很多填充0)，所以打印有效切片即可
>**最后，如果没有错误，执行到Ok(())，就成功返回Ok(())**

3. 编写主函数
```
fn main() -> std::io::Result<()> {
    let listener = TcpListener::bind("0.0.0.0:3490")?;
    println!("服务器监听在端口 3490...");
    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                match stream.peer_addr() {
                    Ok(addr) => println!("新连接: {}", addr),
                    Err(e) => {
                        eprintln!("获取客户端地址失败: {}", e);
                        continue;
                    }
                }
                thread::spawn(move || {
                    if let Err(e) = handle_client(stream){
                        eprintln!("处理错误连接: {}", e);
                    }
                });
            }
            Err(e) => eprintln!("连接失败: {}", e),
        }
    }
    Ok(())
}
```
**讲解代码：**
>**第2行：**
>TcpListener::bind()：创建一个新的 TcpListener，它将绑定到指定的地址，返回的`Result<TcpListener>`已准备好接受连接，其内部会完成socket()、bind()、listen()
>"0.0.0.0:3490"：监听本机所有网卡，端口 3490
>接受参数为：ToSocketAddrs
>**第4行：**
>listener.incoming()是迭代器，阻塞等待新客户端连接到来
>每来一个连接就产出一个`Result<TcpStream, io::Error>`；有客户端才会往下执行，没有就阻塞在这里
>**第5行用match是因为每来一个连接就产出一个Result《TcpStream, io::Error》，要分开处理**
>**第6~19行都是在处理Ok(TcpStream)的情况：**
>返回Ok(TcpStream)相当于accept()成功
>如果连接成功，我们可以打印对端地址，这要用到TcpStream::peer_addr()
>然而这个函数返回值是 `Result<SocketAddr>`，又要用match处理(**第7~13行**)
>我们创建一个新线程来处理这个连接，就要用到thread::spawn() 详见 spawn
>     **传入参数是闭包(也就是线程内运行什么任务)：**
>     move闭包捕获stream
>     子线程运行处理单个客户端连接的函数handle_client(发送问好，打印收到的数据)
>     处理错误

#### 4.2 TCP客户端
客服端实现较简单：connect() -> 读服务器发的数据 -> 向服务器发送数据
```
use std::net::TcpStream;
use std::io::{Read,Write};

fn main() -> std::io::Result<()> {
    let mut stream  = TcpStream::connect("127.0.0.1:3490")?;
    //接收数据
    let mut buf = [0;128];
    let n = stream.read(&mut buf)?;
    println!("收到: {}", String::from_utf8_lossy(&buf[..n]));
    //发送数据
    stream.write_all(b"Hello from Client!")?;
    Ok(())
}
```
简要说明：
>pub fn from_utf8_lossy(v: &[u8]) 将字节切片转换为字符串，包括无效字符

#### 4.3 UDP服务器
UDP 是无连接协议，没有三次握手、没有listen/accept，所以实现也很简单：bind() -> recv_from
```
use std::net::UdpSocket;

fn main() -> std::io::Result<()> {
    //这里无需mut
    let socket = UdpSocket::bind("0.0.0.0:4950")?;
    println!("UDP服务器监听在端口 4950...");
    //读取数据前先准备缓冲区
    let mut buf = [0;1024];
    //UDP服务器一般死循环等待报文
    loop{
        //amt(amount)：本次收到数据包实际字节长度
        //src：SocketAddr，数据包来源的客户端 IP + 端口
        //UDP 无连接，每一包都要拿到对端地址
        let (amt,src) = socket.recv_from(&mut buf)?;
        println!("从{}收到{}字节: {:?}", src, amt, &buf[..amt]);
        //(可不写)回复
        socket.send_to(&buf[..amt],&src)?;
    }
}
```

#### 4.4 UDP客户端
UPD客户端实现也比较简单：bind() -> send_to(报文,目标地址)
```
use std::net::UdpSocket;

fn main() -> std::io::Result<()> {
    let socket = UdpSocket::bind("0.0.0.0:0")?;//绑定到任意端口
    let msg = "Hello UDP server!";
    //send_to接受报文类型是&[u8],所以要msg.as_bytes()
    socket.send_to(msg.as_bytes(),"127.0.0.1:4950")?;

    //收到回复
    let mut buf = [0;1024];
    let (amt, src) = socket.recv_from(&mut buf)?;
    println!("从 {} 收到回复: {}", src, String::from_utf8_lossy(&buf[..amt]));

    Ok(())
}
```

#### Rust vs C
可以发现Rust实现比C实现简单很多

| 特性    | C                | Rust                      |
| ----- | ---------------- | ------------------------- |
| 内存管理  | 手动               | 自动 (所有权系统)                |
| 错误处理  | errno + 返回值      | `Result<T, E>`              |
| 并发    | fork() + pthread | std::thread + async/await |
| 缓冲区溢出 | 常见漏洞             | 编译时检查                     |
| 资源释放  | 手动 close()       | 自动 (Drop trait)           |
Rust 的优势在于其内存安全保证和现代的并发原语，使得网络编程更加安全和高效
