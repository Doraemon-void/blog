---
title: "二：IP Addresses, structs, and Data Munging"
date: "2026-07-30"
series: "Beej's Guide 网络编程"
order: 2
tags:
  - 计算机网络
---

## 1. IP Addresses, versions 4 and 6
---
#### 1.1 IPv4 & IPv6
- IPv4 地址由 4 个字节（也称作 4 个 “八位组”）组成，通用书写格式是 “数字加点” 形式，示例：`192.0.2.111`(每位的值范围是0~255)
- IPv6(128位) 采用十六进制表示方式，每两个字节作为一段，段与段之间使用冒号分隔，示例：`2001:0db8:c9d2:aee5:73e3:934a:a5ae:9551`
很多 IPv6 地址包含大量连续零段，你可以使用双冒号对连续零进行压缩：
`2001:0db8:ab00:0000:0000:0000:0000:0000 <=> 2001:db8:ab00:: 0000:0000:0000:0000:0000:0000:0000:0001 <=> ::1`
地址`::1`是**本地回环地址**，含义永远是 “本机”；在 IPv4 中对应的回环地址是`127.0.0.1`
如果要把 IPv4 地址`192.0.2.33`写成 IPv6 格式，写法如下：`::ffff:192.0.2.33`

#### 1.2 Subnets 子网
- 假设有地址 `192.0.2.12`，我们可以规定前三个字节为网络部分，最后一个字节为主机部分
    we’re talking about host `12` on network `192.0.2.0`

- 用来标识 IP 地址网络部分的东西叫做**子网掩码**(_netmask_) 将 IP
    - 地址与子网掩码执行按位与运算，就能算出网络地址
        举例：IP 地址 `192.0.2.12` 和掩码 `255.255.255.0` 做按位与，得到网络地址 `192.0.2.0`）
    - 子网掩码使用任意比特长度，不再局限于 8 位、16 位、24 位：
        比如掩码 `255.255.255.252`，代表 30 位网络位、2 位主机位，整个子网最多容纳 4 台主机。子网掩码永远是一串连续的 1，后面紧跟一串连续的 0
    - 但是像 `255.192.0.0` 这样一长串数字形式的掩码用起来很麻烦：一方面人们无法直观看出究竟有多少位网络位，另一方面书写繁琐
        只需在 IP 地址后面加斜杠，斜杠后用十进制数字标注网络位数量，示例：`192.0.2.12/30`
        IPv6 同样使用该写法，例如：`2001:db8::/32`

#### 1.3 Port Numbers 端口号
互联网层（IP）与端到端传输层（TCP、UDP）相互独立：除了 IP 层使用的 IP 地址之外，TCP（stream sockets）与 UDP（datagram sockets）还会使用另一套地址 ——**端口号**。It’s a 16-bit number that’s like the local address for the connection.

- 设想一台服务器，既要接收邮件，又要提供网页服务。如果它只有一个 IP 地址，系统该如何区分这两类不同的流量？
    different services on the Internet have different well-known port numbers.
    完整列表可以查阅 IANA(互联网数字分配机构) 官方端口清单；若使用Unix 系统， `/etc/services` 文件里也能看到
    HTTP (the web) is port 80；telnet is port 23； SMTP邮件协议 is port 25
    Ports under 1024 are often considered special, and usually require special OS privileges to use

## 2 Byte Order 字节序
- 大端序：比如 `0xb34f`，存储时先放高字节 `0xb3`、后放低字节 `0x4f`
- 小端序：数值 `0xb34f` 在内存里会先存低字节 `0x4f`，再存高字节 `0xb3`
- 更理智的大端序又被称作**网络字节序（Network Byte Order）**

- 在组装网络数据包、填充结构体时，你经常需要保证两字节、四字节整数使用网络字节序。可如果你不知道本机原生主机字节序，该如何处理？
    - 我们直接默认本机字节序不适合网络传输，所有数值统一调用函数转换成网络字节序。函数会根据平台自动完成必要的大小端转换，这样代码就能跨不同字节序架构移植。
    - 可供转换的数据分为两类：短整型（2 字节）、长整型（4 字节）
    - 想把短整型从主机字节序转为网络字节序。命名规则：`h`（host，主机）→`to`→`n`（network，网络）→`s`（short，短整型），拼接即为 `htons()`

|Function|Description|
|---|---|
|`htons()`|`h`ost `to` `n`etwork `s`hort|
|`htonl()`|`h`ost `to` `n`etwork `l`ong|
|`ntohs()`|`n`etwork `to` `h`ost `s`hort|
|`ntohl()`|`n`etwork `to` `h`ost `l`ong|
- 数据发送前，把数值转为网络字节序；数据接收后，把数值转回本机主机字节序

**Rust中的字节序处理**
```
use std::net::{Ipv4Addr, Ipv6Addr};

// 将 IP 地址转换为大端字节序
let ip = Ipv4Addr::new(192, 0, 2, 33);
let bytes = ip.octets(); // 已经是网络字节顺序

// 对于端口号
let port: u16 = 8080;
let port_be = port.to_be_bytes(); // 转换为大端字节序
let port_le = port.to_le_bytes(); // 转换为小端字节序

// 从大端字节序转换回来
let port_from_be = u16::from_be_bytes(port_be);

```
Rust 标准库中的 `to_be_bytes()`、`to_le_bytes()`、`from_be_bytes()` 和 `from_le_bytes()` 方法使得字节序转换变得简单明了

## 3 `struct`s 结构体
本节介绍套接字接口(sockets interface)用到的各类数据类型
a socket descriptor 套接字描述符，type：Just a regular `int`

#### 3.1 `struct addrinfo`
- 用于为后续使用准备套接字地址结构，还用于主机名查找和服务名查找(host name lookups, and service name lookups)；建立网络连接时，它几乎是最先用到的结构之一
```
struct addrinfo {
    int              ai_flags;     // AI_PASSIVE, AI_CANONNAME 等标志位
    int              ai_family;    // AF_INET, AF_INET6, AF_UNSPEC
    int              ai_socktype;  // SOCK_STREAM, SOCK_DGRAM
    int              ai_protocol;  // 填 0 代表自动选择协议
    size_t           ai_addrlen;   // ai_addr 指向地址结构的字节大小
    struct sockaddr *ai_addr;      // 指向 sockaddr_in（IPv4）或 sockaddr_in6（IPv6）
    char            *ai_canonname; // 完整规范主机名

    struct addrinfo *ai_next;      // 链表指针，指向下一个节点
};
```
- 你对该结构体配置少量参数后，调用 `getaddrinfo()`。函数会返回指针，指向一条由该结构体组成的链表，链表内已经填好所有你需要的地址信息。
    多数场景下你不需要手动填充这些结构体；大部分时候直接调用 `getaddrinfo()` 自动填充 `addrinfo` 就足够
- 你可以在 `ai_family` 指定强制使用 IPv4 或 IPv6；若填写 `AF_UNSPEC`，程序会自动兼容两种协议。
- `ai_addr` 指针指向 `struct sockaddr`

#### 3.2 `struct sockaddr`
- 用于承载多种套接字类型的通用地址信息
```
struct sockaddr {
    unsigned short    sa_family;    // 地址族，取值 AF_xxx
    char              sa_data[14];  // 14 字节协议地址
};
```
- `sa_family` 有多种取值，本文只涉及 `AF_INET`（IPv4）与 `AF_INET6`（IPv6）
- `sa_data` 存放套接字目标地址与端口
- 为了方便操作 `struct sockaddr`，人们设计配套结构体 `struct sockaddr_in`（后缀 in 代表 Internet），专门用于 IPv4。

#### 3.3 `struct sockaddr_in`

- **_this is the important_ bit**
    `struct sockaddr_in *` 指针可以强制转换为 `struct sockaddr *`，反向转换同样可行。哪怕 `connect()` 函数参数要求传入 `struct sockaddr*`，你依然可以定义 `sockaddr_in`，调用时强制转型即可！
```
// 仅用于 IPv4（IPv6 请看 sockaddr_in6）
struct sockaddr_in {
    short int          sin_family;  // 地址族，固定 AF_INET
    unsigned short int sin_port;    // 端口号
    struct in_addr     sin_addr;    // IPv4 地址
    unsigned char      sin_zero[8]; // 填充位，保证和 sockaddr 大小一致
};
```
借助该结构体，我们可以直接访问地址各个成员。
- `sin_zero` 作用是内存对齐填充，使结构体尺寸和通用 `sockaddr` 保持一致，必须使用 `memset()` 全部置零；
- `sin_family` 对应 `sockaddr` 的 `sa_family`，设为 `AF_INET`；
- `sin_port` 必须使用网络字节序（调用 `htons()` 转换！）。
- `sin_addr` 成员类型是 `struct in_addr`

#### 3.4 `struct in_addr`
```
// 仅用于 IPv4（IPv6 请看 in6_addr）
// 互联网地址（设计成结构体纯粹是历史遗留原因）
struct in_addr {
    uint32_t s_addr; // 32位无符号整数（4字节IPv4地址）
};
```
假设我们定义变量 `struct sockaddr_in ina;`，那么 `ina.sin_addr.s_addr` 就能访问 4 字节 IPv4 地址（网络字节序）

#### 3.5 `struct sockaddr_in6 和 struct in6_addr`
```
struct sockaddr_in6 {
    u_int16_t       sin6_family;   // 地址族，AF_INET6
    u_int16_t       sin6_port;     // 端口号，网络字节序
    u_int32_t       sin6_flowinfo; // IPv6 流标签信息
    struct in6_addr sin6_addr;     // IPv6 地址
    u_int32_t       sin6_scope_id; // 作用域ID（链路本地地址使用）
};

struct in6_addr {
    unsigned char   s6_addr[16];   // 16字节IPv6地址
};
```
和 IPv4 一样，IPv6 地址结构体同时保存 IP 地址与端口

#### 3.6 `struct sockaddr_storage`
- 该结构体尺寸足够大，可以容纳 IPv4 的 `sockaddr_in` 或 IPv6 的 `sockaddr_in6`
- 某些函数调用前，我们无法预知返回的地址是 IPv4 还是 IPv6，这时就传入这个通用大容量结构体，后续再强制转换成对应类型
```
struct sockaddr_storage {
    sa_family_t  ss_family;     // 地址族标识

    // 下方全部是填充对齐字段，由平台实现决定，开发无需关心：
    char      __ss_pad1[_SS_PAD1SIZE];
    int64_t   __ss_align;
    char      __ss_pad2[_SS_PAD2SIZE];
};
```
开发重点只需要关注 `ss_family`：读取该成员判断地址族是 `AF_INET` 还是 `AF_INET6`，随后将整个结构体强制转型为 `struct sockaddr_in` 或者 `struct sockaddr_in6`

结构体关系图：
![sockaddr、sockaddr_in、sockaddr_in6 的结构体关系图](/notes/beej/sockaddr-structs.png)

#### 3.7 Rust中的网络地址结构
Rust 的 `std::net` 模块提供了更安全、更符合人体工程学的类型
```
use std::net::{SocketAddr, SocketAddrV4, SocketAddrV6, Ipv4Addr, Ipv6Addr};

// IPv4 地址
let ipv4 = Ipv4Addr::new(192, 0, 2, 33);
let socket_v4 = SocketAddrV4::new(ipv4, 8080);

// IPv6 地址
let ipv6 = Ipv6Addr::new(0x2001, 0xdb8, 0, 0, 0, 0, 0, 1);
let socket_v6 = SocketAddrV6::new(ipv6, 8080, 0, 0);

// 统一的 SocketAddr 枚举
let addr: SocketAddr = "192.0.2.33:8080".parse().unwrap();
let addr6: SocketAddr = "[2001:db8::1]:8080".parse().unwrap();

match addr {
    SocketAddr::V4(v4) => println!("IPv4: {}", v4),
    SocketAddr::V6(v6) => println!("IPv6: {}", v6),
}

```
Rust 的优势：
- 类型安全：IPv4 和 IPv6 是不同的类型
- 解析方便：可以直接从字符串解析
- 模式匹配：通过枚举区分不同版本

## 4 IP Addresses, Part Deux  IP 地址（下篇）

### 4.1 处理IP地址的函数
- *手动解析地址，再通过 `<<` 运算符逐段组装太麻烦了*
    幸运的是，有一系列函数专门用来处理 IP 地址

- *假设你有 `struct sockaddr_in ina`，并且需要把 IP 地址字符串 `10.12.110.57`（IPv4）或者 `2001:db8:63b3:1::3490`（IPv6）存入该结构体,如何做到？*
你可以使用 `inet_pton()` 函数：它能把点分十进制格式的 IP 字符串，转换为 `struct in_addr`（IPv4）或 `struct in6_addr`（IPv6），区分方式由传入的 `AF_INET` / `AF_INET6` 指定
%% `pton` 全称 presentation to network，你也可以记成 “可读格式 → 网络二进制格式” %%
IPv4、IPv6 的转换示例代码如下：
```
struct sockaddr_in sa;   // IPv4地址结构体
struct sockaddr_in6 sa6; // IPv6地址结构体

inet_pton(AF_INET, "10.12.110.57", &(sa.sin_addr));
inet_pton(AF_INET6, "2001:db8:63b3:1::3490", &(sa6.sin6_addr));
```
上面这段代码健壮性不足，缺少错误处理。inet_pton() 出错时返回 -1；如果传入的 IP 格式非法，返回 0。使用返回值前务必判断结果

- *反向操作怎么做？如果你手里有一个 `struct in_addr`，想把它打印成点分十进制格式（或是将 `struct in6_addr` 转为冒号十六进制字符串），该怎么做？*
需要 `inet_ntop()`
%% （`ntop` 全称 network to presentation，可以记为 “网络二进制 → 可读字符串”） %%
示例代码：
```
// IPv4 示例
char ip4[INET_ADDRSTRLEN];  // 存放IPv4字符串的缓冲区
struct sockaddr_in sa;      // 假设结构体已经填充地址信息

inet_ntop(AF_INET, &(sa.sin_addr), ip4, INET_ADDRSTRLEN);
printf("The IPv4 address is: %s\n", ip4);

// IPv6 示例
char ip6[INET6_ADDRSTRLEN]; // 存放IPv6字符串的缓冲区
struct sockaddr_in6 sa6;    // 假设结构体已经填充地址信息

inet_ntop(AF_INET6, &(sa6.sin6_addr), ip6, INET6_ADDRSTRLEN);
printf("The address is: %s\n", ip6);
```
调用该函数时，依次传入地址类型（IPv4/IPv6）、二进制地址指针、字符串缓冲区指针、缓冲区最大长度
系统提供两个宏简化缓冲区长度定义：`INET_ADDRSTRLEN`（IPv4 最大字符串长度）、`INET6_ADDRSTRLEN`（IPv6 最大字符串长度）
这一组函数仅处理纯数字 IP 地址，无法对域名（例如 `www.example.com`）执行 DNS 域名解析。域名解析需要使用 `getaddrinfo()`

- *为什么`ntop`函数需要这些参数？又为什么要用到宏？*
    1. 第一个参数是地址族：根据这个参数决定用什么解析规则(IPv4/IPv6)
    2. 第二个参数是二进制地址指针：不能直接传入结构体sockaddr_in，所以传入其指针；`void*`是泛型设计：同一个函数兼容 IPv4/IPv6 两套地址结构
    3. 第三个参数是用户提供的字符串缓冲区：库函数不自动分配堆内存，必须提前开辟一块字符数组，传给函数存放结果
    4. 第四个参数是缓冲区长度：防止溢出
    配套的两个宏是IPv4/IPv6 最大字符串长度

### 4.2 Rust中的IP地址处理
- *Rust 让 IP 地址处理变得简单 -- 为什么这么说？*
1. 类型安全，杜绝地址混用
    C：`in_addr / in6_addr` 只是裸二进制存储，没有类型区分约束，很容易把 IPv4 二进制误传给 IPv6 函数，运行时出错
    Rust：`Ipv4Addr、Ipv6Addr` 是两个完全独立强类型。编译器静态拦截 IPv4/IPv6 类型混淆，编译期报错，不会等到运行才崩溃
2. 字符串解析极度简洁
    C：手动传入地址族 `AF_INET/AF_INET6`；手动判断返回值 `-1/0/1` 区分「系统错误」和「格式非法」，易忘记错误检查
    Rust：自动识别解析逻辑；错误封装为 `Result`，强制你处理解析失败
3. 无需手动管理内存缓冲区
    C：使用缓冲区
    Rust：`.to_string()` 直接返回 `String`，由标准库管理内存，不存在缓冲区溢出
4. Rust 的 `std::net` 模块提供了丰富的方法来检查和操作 IP 地址：
    - `is_loopback()` - 检查是否是环回地址
    - `is_private()` - 检查是否是私有地址
    - `is_multicast()` - 检查是否是组播地址
    - `is_unspecified()` - 检查是否是未指定地址

```
use std::net::{Ipv4Addr, Ipv6Addr, SocketAddrV4, SocketAddrV6};
use std::str::FromStr;

// 从字符串解析
let ipv4: Ipv4Addr = "10.12.110.57".parse().unwrap();
let ipv6: Ipv6Addr = "2001:db8:63b3:1::3490".parse().unwrap();

// 直接构造
let ipv4 = Ipv4Addr::new(10, 12, 110, 57);

// 转换为字符串
let ip_string = ipv4.to_string();

// Socket 地址（包含端口）
let socket = SocketAddrV4::new(Ipv4Addr::LOCALHOST, 8080);
println!("{}", socket); // 输出: 127.0.0.1:8080

// 检查地址类型
if ipv4.is_loopback() {
    println!("这是环回地址");
}

if ipv4.is_private() {
    println!("这是私有地址");
}

```
**代码讲解**
>**第5行：**
`.parse()` (实现`FromStr trait`)，把文本 IP 字符串 → 二进制 IP 结构体
>返回类型 `Result<Ipv4Addr, ParseError>`
>`.unwrap()` 是 `Result` 的方法：
    如果是 `Ok(v)` → 取出里面的值
    如果是 `Err(e)` → 程序直接崩溃（panic），打印错误信息
>**第9行：**
>`Ipv4Addr::new(10, 12, 110, 57)` 四个参数是 IPv4 四段十进制数字，直接创建地址，不需要字符串解析
>**第11行**：
>`to_string()`即C中的`inet_ntop()`，无需使用缓冲区
>**第15行：**
>`SocketAddrV4` = IP 地址 + 端口
>`Ipv4Addr::LOCALHOST` 常量 = `127.0.0.1`（环回地址）
>**第18 ~ 25行：**
>`.is_loopback()`：是否为环回地址 `127.0.0.0/8`
>`.is_private()`：是否 RFC1918 私有网段（10.x.x.x、192.168.x.x 等）

### 4.3 Private (Or Disconnected) Networks 私有(或断开的)网络
许多场所都会部署防火墙，将内网与外网隔离，以此保障自身网络安全。防火墙通常会通过**网络地址转换（NAT,_Network Address Translation_）**，把 “内网” IP 地址转换为全世界均可访问的 “公网” IP 地址

- *我家中部署了防火墙，DSL 运营商只分配给我两个静态 IPv4 地址，但内网一共有七台设备。这要如何实现？*
两台设备不能共用同一个 IP 地址，否则网络流量无法确定目标主机
**答案是：内网设备使用互不相同的 IP**。它们处于私有网络中，该网段预留了两千四百万个地址，理论上仅供内网使用，在外网视角下，这些地址仅属于我
运作流程如下：
当我登录一台远端服务器，服务器记录的登录来源地址是 192.0.2.33，这正是运营商分配给我的公网 IP，但我查询本地电脑的 IP，显示为 10.0.0.5(负责双向地址转换的正是防火墙，也就是 NAT 机制)
`10.x.x.x` 是预留私有网段之一，仅允许在完全隔离的网络，或是防火墙后方的内网中使用。RFC 1918 规范详细规定了可用私有网段，日常最常见的两类网段是 `10.x.x.x` 和 `192.168.x.x`（x 取值范围 0~255）
%%`192.0.2.x` 网段是专门预留给教学的，用于文档内模拟真实 IP 地址%%

- *那么IPv6呢？*
某种意义上 IPv6 也存在私有内网地址。依据 RFC 4193，这类地址以 `fdXX:`开头
不过 IPv6 环境一般很少搭配 NAT 使用（IPv6 转 IPv4 网关除外），因为理论上 IPv6 拥有海量地址资源，不再需要 NAT

### 4.4 Rust中检测私有地址
```
use std::net::{Ipv4Addr, Ipv6Addr};

fn is_private_ipv4(ip: &Ipv4Addr) -> bool {
    ip.is_private()
}

fn check_address(ip: &str) {
    if let Ok(addr) = ip.parse::<Ipv4Addr>() {
        if addr.is_private() {
            println!("{} 是私有 IPv4 地址", addr);
        } else if addr.is_loopback() {
            println!("{} 是环回地址", addr);
        } else if addr.is_link_local() {
            println!("{} 是链路本地地址", addr);
        }
    }
}
```
**讲解代码**
>**第3行：**
>检查IPv4是不是私有地址，封装`.is_private()`，只是对传入参数做了一个`&Ipv4Addr`的限制
>**第7~17行：**
>先将字符串转化为IPv4的地址类型，`if let Ok(addr)`写法便于处理错误(是较于`unwrap` 的轻量解析写法)
>然后依次检查是否是私有/环回/链路本地地址

## 5 Jumping from IPv4 to IPv6

### 5.1 IPv4移植到IPv6的代码改动
- *怎样从IPv4移植到IPv6？*
`<1>` 不要手动给`sockaddr_in`填充字段，改用`getaddrinfo()`自动生成`sockaddr`结构体 → 代码不用区分 IPv4 和 IPv6，一套逻辑同时兼容两种协议

`<2>` 凡是代码里硬编码 IP 版本相关逻辑的地方，尽量封装成辅助函数
- *如何理解`<2>`？*
场景：如果代码里写死了`AF_INET`、结构体类型这类和 IP 版本绑定的代码，把这部分逻辑封装成工具函数
好处：后续切换 IPv4/IPv6 时，只需要修改 helper 函数，不用到处改代码，减少出错

`<3>` 将 `AF_INET` 更改为 `AF_INET6`(地址族)；将 `PF_INET` 更改为 `PF_INET6`(协议族)

`<4>` Change `INADDR_ANY` assignments to `in6addr_any` assignments
```
struct sockaddr_in sa;
struct sockaddr_in6 sa6;

sa.sin_addr.s_addr = INADDR_ANY;  // 监听本机所有IPv4地址
sa6.sin6_addr = in6addr_any;      // 监听本机所有IPv6地址
```
- *如何理解`<4>`*
目标：把 IPv4 服务端「监听所有网卡」的写法，迁移成 IPv6 写法(不用管细节)

`<5>` 把 `struct sockaddr_in` 换成 `struct sockaddr_in6`（地址结构体）；把 `struct in_addr` 换成 `struct in6_addr`(二进制IP)
`<6>` 字符串 ⇔ 二进制地址：弃用 `inet_aton()、inet_addr()`，改用 inet_pton()；弃用 inet_ntoa()，改用 inet_ntop()；
解析出 IPv4 和 IPv6 地址，自动生成`sockaddr`：弃用 gethostbyname()，改用功能更强的 getaddrinfo()；
IP 反向解析（IP→域名）：弃用 gethostbyaddr()，改用更完善的 getnameinfo()
`<7>` IPv4 有广播地址`INADDR_BROADCAST`；IPv6 协议彻底取消了广播机制，所有一对多的通信场景，都要改用 IPv6 组播（multicast），不能再写广播代码

### 5.2 Rust中的IPv4/IPv6兼容编程
- *Rust 的标准库设计使 IP 版本无关编程变得更加简单 -- 为什么？*
对比：
C 语言：IPv4 和 IPv6 是两套完全分离的结构体（`sockaddr_in` / `sockaddr_in6`），代码要写两套分支，很容易写死版本；
Rust：**IpAddr、SocketAddr 枚举统一封装两种 IP**，一份代码自动兼容 IPv4/IPv6，实现「IP 版本无关编程」

示例代码：
```
use std::net::{IpAddr, Ipv4Addr, Ipv6Addr, SocketAddr};

// IP 版本无关的代码
fn connect_to_host(addr: &str, port: u16) -> std::io::Result<()> {
    // 自动解析 IPv4 或 IPv6
    let socket_addr: SocketAddr = format!("{}:{}", addr, port)
        .parse()
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidInput, e))?;

    match socket_addr {
        SocketAddr::V4(v4) => {
            // 处理 IPv4 连接
            println!("连接到 IPv4: {}", v4);
        }
        SocketAddr::V6(v6) => {
            // 处理 IPv6 连接
            println!("连接到 IPv6: {}", v6);
        }
    }

    Ok(())
}

// 使用示例
fn main() -> std::io::Result<()> {
    // IPv4 示例
    connect_to_host("192.0.2.1", 8080)?;

    // IPv6 示例
    connect_to_host("2001:db8::1", 8080)?;

    // 主机名（需要 DNS 解析）
    // 注意：标准库不提供 DNS 解析，需要使用 toSocketAddrs
    use std::net::ToSocketAddrs;
    let addrs: Vec<SocketAddr> = "example.com:80".to_socket_addrs()?.collect();
    for addr in addrs {
        println!("解析到: {}", addr);
    }

    Ok(())
}
```
**讲解代码：**
>**第6~7行：**
>`format!("{}:{}", addr, port)` → 把 `ip+端口` 拼成字符串直接 `.parse()` (文本 IP 字符串 → 二进制 IP 结构体)
>**第8行：**
> `.map_err(...)` 用于处理 `Result` 的错误分支
> **第10~19行：**
> `match`模式匹配处理两种格式
> **第34行：**
> `ToSocketAddrs` trait = Rust 版 `getaddrinfo()`

绑定(`bind`)到任意地址：
```
use std::net::{TcpListener, Ipv4Addr, Ipv6Addr, SocketAddr};

// IPv4 - 绑定到所有接口
let listener_v4 = TcpListener::bind((Ipv4Addr::UNSPECIFIED, 8080))?;

// IPv6 - 绑定到所有接口
let listener_v6 = TcpListener::bind((Ipv6Addr::UNSPECIFIED, 8080))?;

// 或者使用字符串
let listener = TcpListener::bind("[::]:8080")?;  // IPv6 任意地址
let listener = TcpListener::bind("0.0.0.0:8080")?;  // IPv4 任意地址
```

|C 常量|Rust 等价物|说明|
|---|---|---|
|`INADDR_ANY`|`Ipv4Addr::UNSPECIFIED` (0.0.0.0)|绑定到所有 IPv4 接口|
|`in6addr_any`|`Ipv6Addr::UNSPECIFIED` (::)|绑定到所有 IPv6 接口|
|`INADDR_LOOPBACK`|`Ipv4Addr::LOCALHOST` (127.0.0.1)|IPv4 环回地址|
|`in6addr_loopback`|`Ipv6Addr::LOCALHOST` (::1)|IPv6 环回地址|
