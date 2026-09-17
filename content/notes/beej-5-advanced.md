---
title: "五：Slightly Advanced Techniques"
date: "2026-08-05"
series: "Beej's Guide 网络编程"
order: 5
tags:
  - 计算机网络
---

### 1 Blocking
- 阻塞的场景
    运行监听程序时，程序就停在那儿直到数据包到来，这是因为程序调用了recvfrom()，但此时尚无数据，于是recvfrom()就发生了 “阻塞”（也就是原地休眠），一直等到数据抵达
    `accept()`会阻塞，所有`recv()`系列函数都会阻塞 -> **它们之所以能阻塞，是因为系统允许这么做**，当你用`socket()`创建套接字描述符时，内核默认将它设置为阻塞模式
- 如果你不想让套接字处于阻塞模式，就要调用`fcntl()`：
    阻塞/非阻塞是文件描述符级别的属性，标志（`O_NONBLOCK`）保存在内核中该文件描述符对应的文件表项（struct file）的 f_flags 字段中
    内核默认阻塞是出于简单和兼容性考虑，但高并发场景需主动改为非阻塞，配合 epoll/select 使用
    改为非阻塞模式自然就要修改文件描述符属性，`fcntl` = file control（文件控制）
```
#include <unistd.h>
#include <fcntl.h>
...
sockfd = socket(PF_INET, SOCK_STREAM, 0);
fcntl(sockfd, F_SETFL, O_NONBLOCK);
...
```
- 把套接字设置为非阻塞模式后，你就可以对套接字做轮询（poll），查询是否有数据
- 如果你尝试从非阻塞套接字读取，但此时没有数据，它不会阻塞等待 —— 会直接返回‑1，同时全局变量errno被置为`EAGAIN`或者`EWOULDBLOCK`
    `EAGAIN`：E = error，AGAIN  = again → "再试一次"（资源暂时忙）
    `EWOULDBLOCK`：E，would，block → "如果阻塞，我会等，但您不想等"
    非阻塞模式下 `EAGAIN`/`EWOULDBLOCK` 是"暂时无数据"的信号，需由事件循环驱动重试，而非视为错误终止程序

- 但一般来说，这种轮询并不是好方案：如果让程序忙等待，不停轮询套接字是否有数据，会疯狂消耗 CPU 资源

### 2 poll()
- poll 本身意为“轮询”，系统调用 poll() 的准确定义：Synchronously I/O multiplexing（同步 I/O 多路复用）
- 真实场景：你真正想要实现的，是能够同时监控一堆套接字，然后只处理那些已经准备好数据的套接字，这样就不用不停地轮询全部套接字，挨个检查哪个已经可以读数据
    - *怎么避免轮询？*
        有点反直觉：正是**使用poll()系统调用来避免手动忙轮询，把脏活累活交给操作系统**，让 OS 通知我们：哪个套接字上已经有数据可读。在此期间，进程可以休眠，节约系统资源
    - poll()的缺陷：当连接数量极其庞大时，poll()性能会很差。这种场景下，使用事件库（例如libevent2）会获得更好性能，这类库会自动选用系统上性能最优的底层实现(比如Linux的epoll)
    - 整体思路：
        维护一个struct pollfd数组，里面记录要监控哪些套接字描述符，以及要监控哪类事件
        程序会在poll()调用处阻塞，直到某一个被监控事件触发（例如 “套接字可读！”），或者到达用户指定的超时时间
        有个很实用的特性：处于listen()监听状态的套接字，当有新连接到来、可以执行accept()时，就会返回 “可读” 事件

- 函数原型：
```
#include <poll.h>
int poll(struct pollfd fds[], nfds_t nfds, int timeout);
```
**参数说明：**
>`fds`：信息数组，记录要监控哪些套接字、监控什么事件
`nfds`：数组中元素的个数
`timeout`：超时时间，单位毫秒
**返回值**：数组中发生事件的元素总数量
- pollfd结构体定义
```
struct pollfd {
    int fd;         // 套接字描述符
    short events;   // 输入掩码：应用感兴趣的事件（如可读、可写）
    short revents;  // 输出掩码：poll()返回后内核填充的实际发生事件（含错误状态）
};
```
- events 字段是输入位掩码，告诉内核“我关心哪些事件”，通过按位或（|）组合宏设置

| 宏       | 说明                              |
| ------- | ------------------------------- |
| POLLIN  | 套接字有数据可以调用`recv()`读取时 -> 触发通知   |
| POLLOUT | 套接字可以发送`send()`数据、不会阻塞时 -> 触发通知 |
| POLLHUP | 对端关闭连接时 -> 触发通知                 |
- 使用流程：
    把struct pollfd数组配置完毕，传入poll()，同时传入数组长度、毫秒级超时（超时传负数代表永久等待，永不超时）
    poll()返回后，检查revents字段，判断POLLIN、POLLOUT是否置位，代表对应事件已经发生

- 示例代码一：等待 2.5 秒，监控标准输入是否可读
```
#include <stdio.h>
#include <poll.h>

int main(void)
{
    struct pollfd pfds[1]; // 如果要监控更多，数组开大一点

    pfds[0].fd = 0;          // 标准输入
    pfds[0].events = POLLIN; // 可读时通知我

    // 如果还需要监控其他描述符：
    //pfds[1].fd = some_socket; // 某个套接字描述符
    //pfds[1].events = POLLIN;  // 可读时通知我

    printf("Hit RETURN or wait 2.5 seconds for timeout\n");

    int num_events = poll(pfds, 1, 2500); // 超时2.5秒

    if (num_events == 0) {
        printf("Poll timed out!\n");
    } else {
        int pollin_happened = pfds[0].revents & POLLIN;

        if (pollin_happened) {
            printf("File descriptor %d is ready to read\n",
                    pfds[0].fd);
        } else {
            printf("Unexpected event occurred: %d\n",
                    pfds[0].revents);
        }
    }

    return 0;
}
```
**代码解读：**
>**第6~13行：**
> `struct pollfd pfds[1]` -> 只监控1个连接
> 填充pollfd结构体：fd = 0 -> 标准输入(键盘)；events = POLLIN -> 可读时通知
>**第17行：调用poll()**
>检查结构体数组pfds，数组长度为1，超时时间为2500ms(=2.5s)
>用num_events接受返回值
>**第19~20行：**
>poll()返回值为0表示超时(返回值为-1表示出错)
>**第21~26行：**
>poll()返回值>0表示有事件发生
> `int pollin_happened = pfds[0].revents & POIN;`  事件检查：revents是内核回填的字段，记录这个 fd 实际发生了哪些事件，用按位与检测 POLLIN 位是否被置1
> 如果POLLIN置位：标准输入就绪，可以读取数据
> **第27~30行：**
> 如果POLLIN未被置位：打印 revents 原始值，可能发生 POLLERR/POLLHUP 等其他意外事件

- 注意：poll()返回发生事件的元素总数，但不会告诉你具体是数组里哪几个下标，你仍然需要遍历数组判断
- *如何往 poll 监控集合新增文件描述符？*
    保证数组有足够空间
    不够时调用realloc()动态扩容
- *如何从集合删除描述符？*
    方案一：把数组末尾元素覆盖待删除位置，再传给poll()的计数减一
    方案二：把对应fd字段设置为负数，poll()会直接忽略该项

- 示例代码二：支持 telnet 接入的聊天服务器
    - 整体逻辑：
        1. 创建监听套接字，加入 poll 监控集合 --> 有新连接到来时会触发可读事件
        2. 新连接到来，把新套接字加入pollfd数组 --> 空间不足就动态扩容
        3. 连接关闭时，把它从数组移除
        4. 连接可读时读取收到的数据，广播转发给其他所有客户端，让所有人看到别人输入的内容
    - 运行方式：
        - 运行这个 poll 服务器：在一个终端启动程序，打开多个终端执行telnet localhost 9034；在任意窗口敲回车输入内容，其他窗口就能看到消息
        - 如果你在 telnet 中按CTRL‑]输入quit退出，服务器会检测断开，把该套接字从监控集合移除
`< 1 >` `get_listener_socket()` 创建监听套接字
```
int get_listener_socket(void)
{
    int listener;
    int yes=1;
    int rv;

    struct addrinfo hints, *ai, *p;

    memset(&hints, 0, sizeof hints);
    hints.ai_family = AF_INET;
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_flags = AI_PASSIVE;
    if ((rv = getaddrinfo(NULL, PORT, &hints, &ai)) != 0) {
        fprintf(stderr, "pollserver: %s\n", gai_strerror(rv));
        exit(1);
    }

    for(p = ai; p != NULL; p = p->ai_next) {
        listener = socket(p->ai_family, p->ai_socktype, p->ai_protocol);
        if (listener < 0) {
            continue;
        }
        setsockopt(listener, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(int));
        if (bind(listener, p->ai_addr, p->ai_addrlen) < 0) {
            close(listener);
            continue;
        }
        break;
    }
    if (p == NULL) {
        return -1;
    }
    freeaddrinfo(ai);
    if (listen(listener, 10) == -1) {
        return -1;
    }
    return listener;
}
```
**代码解读：**
>**第9~16行：**
>设置hints：IPv4，流式套接字，`hints.ai_flags = AI_PASSIVE` -> 当getaddrinfo()第一个参数node为NULL时(不为NULL忽略 `AI_PASSIVE`标志)，让返回的地址结构填充为通配地址（IPv4 为0.0.0.0，IPv6 为::），该地址用于bind()，使套接字监听本机所有网络接口
> `rv = getaddrinfo(NULL, PORT, &hints, &ai)` -> 生成本机用于 bind 的地址链表；`NULL`代表本机地址；PORT：`#define PORT "9034"`
> **第18~33行：**
> 遍历ai链表：依次socket()创建 fd；setsockopt(SO_REUSEADDR)解决 “地址已占用”；bind()绑定端口，绑定成功就跳出循环，失败就 close 当前 fd 试下一个；`freeaddrinfo(ai)`释放 addrinfo 链表内存
> **第34~37行：**
> listen(listener,10)开启监听，backlog=10(最多接入10个连接)，返回监听套接字 listener

`< 2 >` `add_to_pfds()` 往 pollfd 数组添加 fd，自动扩容 --> 用到realloc()
    代码逻辑：
    1. 如果有效元素等于总容量：容量 ×2，realloc扩容堆上数组
    2. 在末尾填入新 fd，监听事件POLLIN，revents清零；
    3. fd_count++有效计数 + 1

`< 3 >` `del_from_pfds()` 删除数组指定下标 i
    直接拿数组最后一项覆盖待删除位置
    有效计数减一
    上层调用完这个函数后，循环变量要执行i--，因为原来末尾的元素被挪到 i 位置，下一轮循环要检查这个被挪过来的项

`< 4 >` `handle_new_connection()` 处理新 TCP 连接
    1. `newfd = accept(listener, (struct sockaddr *)&remoteaddr, &addrlen);` --> 从监听套接字取出已完成连接，返回全新的业务套接字 newfd；remoteaddr 拿到客户端地址
    2. 调用add_to_pfds把 newfd 加入 poll 监控集合

`< 5 >` `handle_client_data()` 处理客户端可读事件
    1. 准备缓冲区：`char buf[256];`
    2. `int nbytes = recv(pfds[*pfd_i].fd, buf, sizeof buf, 0);` 读取客户端数据，返回读到的有效的字节数 --> 返回0：对端正常关闭 TCP 连接（FIN）；返回-1：发生错误
    3. 如果返回值为-1：close(fd)关闭套接字 --> del_from_pfds从监控数组删掉 --> 回退循环下标(\*pfd_i)，处理刚刚被移动到此位置的元素
    4. 如果读取数据成功：循环遍历所有 pollfd 项(跳过监听 socket、跳过发送者socket)，把收到的数据通过send()广播给其他全部客户端

`< 6 >` `process_connections()` 遍历 pollfd 数组处理就绪事件
    for循环中：
    1. 判断revents & (POLLIN | POLLHUP)：可读事件 或者 连接挂断事件
    2. 如果当前 fd 是 listener 监听 socket → `handle_new_connection()`创建新TCP连接
    3. 如果当前 fd 是 "服务器-客户端" 连接的sokect → 进入`handle_client_data()`

`< 7 >` `inet_ntop2()`：实现IP地址转字符串(兼容 IPv4/IPv6 )

`< 8 >` main主函数
    1. 初始时，malloc在堆上分配 5 个pollfd结构体
    2. 获取监听 socket，放到pfds\[0]
    3. 无限主循环 for(;;)：
        poll(pfds,fd_count,-1)：‑1 代表永久阻塞，直到有事件或者信号；返回就绪的 fd 数量；
        poll_count == -1出错退出；
        调用process_connections遍历处理所有就绪描述符

### 3 select()
select()与poll()功能、性能相近，主要差异是 API 用法
select()可移植性略好，但 API 用起来更笨拙
### 4 send()的部分写入问题
当你调用 send() 的时候，它未必会把你请求的全部字节都发送出去，可能只发送了其中一部分，在C语言中我们自己实现`send_all()`
用Rust发送数据直接使用`write_all()`
### 5 数据打包(序列化)
- *什么是打包(序列化)？*
    把内存中程序内部的数据（int、float、结构体等），转换成一套连续、约定格式的字节流；接收方再把字节流还原回内存数据，叫解包（反序列化）
- *为什么要打包？*
    1. 网络传输只认字节流
        网络只能收发原始字节，不能直接发送内存里的 int、结构体对象
    2. 解决跨平台可移植问题
        不同机器字节序（大小端）不一样；
        浮点数比特表示可能不同；
        C 结构体存在编译器插入的对齐填充 padding，如果直接发送结构体整块内存，会导致对端解析错乱；
        - 序列化统一成约定二进制格式，两端就能正确解析
- *解决方案*
    1. 方案一：发送前把数字编码成文本
        优点：网络上传输的数据人类可读，便于打印调试(在带宽压力不大的场景，人类可读协议非常好用，例如 IRC（互联网中继聊天）协议)
        缺点：转换开销大，数据占据更大空间
    2. 方案二：直接发送原始数据
        不能保证可移植性
    3. 推荐-方案3：将数字编码为可跨平台移植的二进制格式，接收方再做解码
        把数据打包为约定格式，再网络传输，接收端解包

- 数据打包举例：将float、double编码为 IEEE‑754 格式的代码
```
#define pack754_32(f) (pack754((f), 32, 8))
#define pack754_64(f) (pack754((f), 64, 11))
#define unpack754_32(i) (unpack754((i), 32, 8))
#define unpack754_64(i) (unpack754((i), 64, 11))

uint64_t pack754(long double f, unsigned bits, unsigned expbits)
{
    long double fnorm;
    int shift;
    long long sign, exp, significand;

    // 扣除符号位
    unsigned significandbits = bits - expbits - 1;

    if (f == 0.0) return 0; // 特殊值0提前处理

    // 判断符号，开始归一化
    if (f < 0) { sign = 1; fnorm = -f; }
    else { sign = 0; fnorm = f; }

    // 归一化，同时记录指数偏移
    shift = 0;
    while(fnorm >= 2.0) { fnorm /= 2.0; shift++; }
    while(fnorm < 1.0) { fnorm *= 2.0; shift--; }
    fnorm = fnorm - 1.0;

    // 计算尾数的二进制整数形式
    significand = fnorm * ((1LL<<significandbits) + 0.5f);

    // 计算偏移后的指数（加bias偏移量）
    exp = shift + ((1<<(expbits-1)) - 1);

    // 拼接符号位、指数、尾数返回
    return (sign<<(bits-1)) | (exp<<(bits-expbits-1)) | significand;
}

long double unpack754(uint64_t i, unsigned bits, unsigned expbits)
{
    long double result;
    long long shift;
    unsigned bias;

    // 扣除符号位
    unsigned significandbits = bits - expbits - 1;

    if (i == 0) return 0.0;

    // 取出尾数部分
    result = (i&((1LL<<significandbits)-1));
    result /= (1LL<<significandbits);
    result += 1.0f;

    // 处理指数
    bias = (1<<(expbits-1)) - 1;
    shift = ((i>>significandbits)&((1LL<<expbits)-1)) - bias;
    while(shift > 0) { result *= 2.0; shift--; }
    while(shift < 0) { result /= 2.0; shift++; }

    // 应用符号位
    result *= (i>>(bits-1))&1? -1.0: 1.0;

    return result;
}
```
**简要说明：** 代码仅用于理解"打包"的概念，无需详读
>`pack754`：把 long double 浮点数值 → 转换成对应 IEEE754 位模式，存进uint64_t无符号整数
>`unpack754`：把整数里的位模式 → 还原回 long double 浮点数
>**IEEE754 格式内存布局**：`[1位符号S][expbits位指数E][significandbits位尾数M]`

- *结构体该怎么打包？*
    编译器会在结构体内部任意插入内存对齐填充字节，因此不能直接把整个结构体整块网络发送，无法跨平台
    ▲**结构体网络传输的正确做法：逐个字段独立打包；接收端收到后，逐个字段解包，回填结构体**

- Rust 不会像 C 那样手写一堆 packi16 / unpacki32 底层打包函数，主流方案：serde + 序列化格式实现库(serde_json/bincode/postcard等等)，示例如下：
```
use serde::{Serialize, Deserialize};

// 派生宏自动实现序列化、反序列化 trait
#[derive(Debug, Serialize, Deserialize)]
struct Msg {
    id: u32,
    temp: f32,
    name: String,
}

fn main() {
    let msg = Msg {
        id: 100,
        temp: 23.5,
        name: "hello network".to_string(),
    };

    // ========== 序列化（打包：内存结构体 → 字节数组Vec<u8>）==========
    let bytes: Vec<u8> = bincode::serialize(&msg).unwrap();
    println!("序列化字节长度：{}", bytes.len());

    // ========== 反序列化（解包：字节数组 → 内存结构体）==========
    let msg_back: Msg = bincode::deserialize(&bytes).unwrap();
    println!("{:#?}", msg_back);
}
```

### 6 数据封装
- *什么是数据封装？*
    即数据前面加上头部，这个头部其实就是一段二进制数据，存放你的项目所需的一切必要信息(比如标识信息、数据包长度)
- *为什么要数据封装？*
    - 原因：TCP 只负责传输一串连续的字节，它完全不理解你的 “消息 / 数据包” 概念，不会帮你把数据切分成你发送时的一个个独立单元
    - 场景：一个叫tom的用户发送 “Hi”，而另一个叫Benjamin的用户发送 “Hey guys what is up?”
        调用send()往外发送，输出数据流就变成这样：t o m H i B e n j a m i n H e y g u y s w h a t i s u p ?
        - *那客户端怎么判断一条消息从哪开始、到哪结束？*
        所以我们把数据封装进一个小型头部 + 数据包结构，客户端与服务器都知道如何打包和解包这些数据 --> **我们实际上已经在定义一套描述客户端与服务器如何通信的协议了**

- 封装数据举例
    我们设定用户名固定占 8 个字符，不足则用'\0'填充
    聊天数据为可变长度，最大 128 字节
    这一套适用于该场景的数据包样例结构如下：
        len（1 字节，无符号）：数据包总长度( = 聊天数据长度 + 8)
        name（8 字节）：用户名，必要时用空字符NUL填充
        chatdata（n 字节）：实际聊天数据，最多 128 字节
根据定义我们得到两个数据包：(数据包里所有二进制整数都要采用网络字节序，即大端序)
![聊天数据包结构：len、name、chatdata 三段](/notes/beej/packet-structure.png)

- 保证全部数据发送完毕：应当使用类似前面sendall()的函数
- 保证全部数据接受完全：
    - 方案一：先调用一次recv()，只读取数据包的长度。拿到长度后，再次调用recv()，读取剩余字节（可能要反复调用），直到收齐完整包
        优点：缓冲区只需存下一个数据包大小即可
        缺点：至少要调用两次recv()才能拿到完整数据包
    - 方案二：用大工作缓冲区
        缓冲区数组大小 = 2 × 最大包长，这里就是 2\*137 = 274 字节
        能够容纳「一个完整包 + 下一个包的残缺片段」
        - 工作流程：
            1. 调用 recv()，把读到的字节拷贝追加到 buf 的有效数据尾部
            2. 循环检查缓冲区能不能取出完整包(如果不能：等待下次 recv 继续往缓冲区填数据)
            3. 处理缓冲区碎片：缓冲区可能读到下一个数据包残缺内容(这就是为什么缓冲区要两个最大包长，保证缓冲区填满时一定有个完整包)
                每次取完包，要把后面残留片段向前移动拷贝，带来很大的内存复制开销
                -> 用环形缓冲区

- 了解

| 语言   | 强制读满 N 字节 API                 | 常用缓冲区容器                 | 现成长度帧解码器                             |
| ---- | ----------------------------- | ----------------------- | ------------------------------------ |
| C    | 无，手动循环 recv                   | 普通数组，手动`memmove`        | 无，全部手写                               |
| Go   | `io.ReadFull()`               | `bytes.Buffer`          | 标准库无，依赖第三方库                          |
| Java | `DataInputStream.readFully()` | `ByteArrayOutputStream` | Netty `LengthFieldBasedFrameDecoder` |
| Rust | `read_exact()`                | `bytes::BytesMut`       | tokio‑util `LengthDelimitedCodec`    |
### 7 广播/组播
- 广播、组播：都是一对多的数据发送方式，只有 UDP 支持；TCP 是一对一，不支持
    - 广播 Broadcast（IPv4 特有，IPv6 没有广播）
        向局域网内所有主机发送数据包
        比喻：在教室大声喊话，教室内所有人都听见，隔壁教室听不到
    - 组播 Multicast(IPv4、IPv6 都支持)
        发给网络中 “加入该组的一部分主机”，而不是全部主机
        教室里面建一个微信群，只有进群的人才收到消息，其他人收不到
