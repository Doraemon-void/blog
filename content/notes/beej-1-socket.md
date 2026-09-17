---
title: "一：What is a socket"
date: "2026-07-28"
series: "Beej's Guide 网络编程"
order: 1
tags:
  - 计算机网络
---

### 0 前言
----
**a way to speak to other programs using standard Unix file descriptors.**

**everything in Unix is a file**：Unix programs do any sort of I/O, they do it by reading or writing to a file descriptor
**So** when you want to communicate with another program over the Internet you’re gonna do it through a file descriptor

Where do I get this file descriptor for network communication？-> You make a call to the **`socket()`** system routine. It returns the socket descriptor, and you communicate through it using the **specialized `send()` and `recv()` socket calls**.
If it’s a file descriptor, why can’t I just use the normal `read()` and `write()` calls to communicate through the socket? -> You can, but `send()` and `recv()` **offer much greater control** over your data transmission.

there are all kinds of sockets, but this document deals only with the first: **Internet Sockets**

There are more, but I’m only going to talk about two types here.
**“Raw Sockets”** are also very powerful and you should look them up.

### 1 What are the two types?
---
There are more, but I’m only going to talk about two types here.
**“Raw Sockets”** are also very powerful and you should look them up.
#### 1.1 One is “Stream Sockets”
- Stream(流式) Sockets
    ***Stream sockets are reliable two-way connected communication streams***(双向连接通信流)
    **If** you output two items into the socket **in the order** “1, 2”, they will arrive in the order “1, 2” at the opposite end. They will also be **error-free**.

- What uses stream sockets?
`telnet、ssh` applications use stream sockets

| 程序   | telnet    | ssh                       |
| ---- | --------- | ------------------------- |
| 传输加密 | 明文        | 全程加密                      |
| 默认端口 | TCP 23    | TCP 22                    |
| 安全性  | 极低，公网严禁使用 | 安全，工业标准                   |
| 附加功能 | 仅终端交互     | 远程登录、文件传输 (sftp/scp)、端口转发 |
你输入的所有字符都需要按照你输入的顺序到达
此外，网络浏览器使用超文本传输协议（Hypertext Transfer Protocol，HTTP），它使用流式套接字来获取页面：
if you telnet to a web site on port 80, and type “`GET / HTTP/1.0`” and hit RETURN twice, it’ll dump the HTML back at you!

- How do stream sockets achieve this high level of data transmission quality?
They use a protocol called “The Transmission Control Protocol(传输控制协议)”, otherwise known as **“TCP”**

>[!NOTE]
>**TCP makes sure your data arrives sequentially and error-free**
>
**IP deals primarily with Internet routing** and is not generally responsible for data integrity.

#### 1.2 the other is “Datagram Sockets”
- Datagram(数据报) Sockets (sometimes called “connectionless sockets”)
    if you send a datagram, it may arrive. It may arrive out of order.
    If it arrives, the data within the packet will be error-free.
    Datagram sockets also use IP for routing, but they don’t use TCP; they use the “User Datagram Protocol”, or **“UDP”** 用户数据报协议

- Why are they connectionless?
     because you don’t have to maintain an open connection(stream sockets need)
    你只需构建一个数据包，贴上带有目标信息的 IP 头部，然后发送出去。不需要连接

- What uses Datagram sockets?
    when a TCP stack is unavailable or
    when a few dropped packets here and there don’t mean the end of the Universe
    示例应用程序：`tftp`（简单文件传输协议，FTP 的小兄弟）、`dhcpcd`（DHCP 客户端）、多人游戏、流媒体音频、视频会议等; `tftp、DHCP`都基于`UDP`

- Data can’t be lost if you expect the application to work when it arrives! What kind of dark magic is this?
    `tftp` and similar programs have their own protocol on top of UDP
    `tftp 协议`规定，对于发送的每个数据包，接收方必须发送回一个数据包，说“我收到了！“（一个“ACK“数据包）。如果原始数据包的发送方在比如说五秒内没有收到回复，他将重新传输该数据包，直到最终收到 ACK。这种确认过程在实现可靠的 `SOCK_DGRAM` 应用程序时非常重要
    对于游戏、音频、视频这类无需可靠传输的应用，丢包时直接忽略受损数据包，或是采用巧妙方式做补偿处理

- Why would you use an unreliable underlying protocol?
    “发出去就完事(fire-and-forget)” 的模式，远比持续跟踪哪些数据已经稳妥送达、保证报文有序等一系列操作要快得多
    如果你传输聊天消息，TCP 非常合适；但如果你每秒要发送 40 条游戏内玩家位置更新报文，就算丢掉一两条也无伤大雅，这时 UDP 就是不错的选择。

#### 1.3 Rust中的Socket类型
在 Rust 中，标准库 `std::net` 模块提供了这两种套接字类型的支持
```
use std::net::{TcpStream, TcpListener, UdpSocket};

// TCP 流式套接字（SOCK_STREAM）
let tcp_stream = TcpStream::connect("127.0.0.1:8080")?;

// TCP 监听器
let tcp_listener = TcpListener::bind("127.0.0.1:8080")?;

// UDP 数据报套接字（SOCK_DGRAM）
let udp_socket = UdpSocket::bind("127.0.0.1:8080")?;

```
 Rust 的类型系统确保了更安全的网络编程：
- `TcpStream` 和 `UdpSocket` 是不同的类型，防止误用
- 所有的 I/O 操作返回 `Result`，强制处理错误
- 资源通过 RAII（资源获取即初始化）自动管理

### 2 Low level Nonsense and Network Theory
---
#### 2.1 _Data Encapsulation_(数据封装)
![数据封装过程：数据自上层协议起，被逐层加上头部](/notes/beej/data-encapsulation.png)
一个数据包诞生之后，最先由上层协议（比如 TFTP）给它包上头部（极少数情况还会加上尾部），这个过程叫做**封装**；紧接着，包含 TFTP 头部的整块数据，又会被下一层协议（UDP）再次封装；之后继续交给下一层（IP 协议）封装；最后交由硬件物理层协议（比如以太网协议）做最后一次封装
当另一台计算机收到这份数据包时，硬件剥离(strip)以太网头部，操作系统内核剥离 IP 头部与 UDP 头部，TFTP 程序再剥离 TFTP 头部，最终拿到原始数据
#### 2.2 _Layered Network Model_ (aka “ISO/OSI”) (分层网络模型)
This Network Model describes a system of network functionality
对于Socket开发者而言，真实的网络硬件与拓扑结构是透明的
>[!NOTE]
>**应用层（Application）**
>**表示层（Presentation）**
>**会话层（Session）**
>**传输层（Transport）**
>**网络层（Network）**
>**数据链路层（Data Link）**
>**物理层（Physical）**

>[!NOTE]
>**Unix 网络体系的分层模型（TCP/IP 四层模型）**
>
>**应用层**（telnet、ftp 等应用）
 **端到端传输层**（TCP、UDP）
 **互联网层（网际层）**（IP 与路由）
 **网络接入层**（以太网、Wi-Fi 等）

这些层级和前文讲的数据封装流程一一对应

 - All you have to do for stream sockets is **`send()`** the data out.
 - All you have to do for datagram sockets is **encapsulate the packet in the method of your choosing and `sendto()` it out**.

- The kernel builds the Transport Layer and Internet Layer on for you
- the hardware does the Network Access Layer.

#### 2.3 Rust与网络分层
Rust 的生态系统提供了从底层到高层的各种网络库

|层次|Rust 库/模块|说明|
|---|---|---|
|应用层|`reqwest`, `hyper`, `tungstenite`|HTTP、WebSocket 等协议|
|传输层|`std::net`, `tokio::net`|TCP/UDP 套接字|
|网络层|`socket2`, `pnet`|底层 socket 控制、原始套接字|
|异步 I/O|`tokio`, `async-std`|高性能异步网络编程|
