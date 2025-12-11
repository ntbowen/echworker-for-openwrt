# ECH Workers for OpenWrt

OpenWrt 平台的 ECH (Encrypted Client Hello) Workers 代理客户端。

## 功能特性

- ✅ **ECH 加密** - 基于 TLS 1.3 ECH 技术，加密 SNI 信息
- ✅ **多协议支持** - 同时支持 SOCKS5 和 HTTP CONNECT 代理协议
- ✅ **透明代理** - 内置 TPROXY 支持，LAN 设备无需任何配置即可翻墙
- ✅ **智能分流** - 三种分流模式：全局代理、跳过中国大陆、直连模式
- ✅ **IPv4/IPv6 双栈** - 完整支持 IPv4 和 IPv6 地址的分流判断
- ✅ **Web 界面管理** - 通过 LuCI 界面配置和管理
- ✅ **独立运行** - 无需 PassWall、OpenClash 等其他插件配合

## 包含组件

| 包名 | 说明 |
|------|------|
| `ech-workers` | ECH Workers 代理客户端二进制程序 |
| `luci-app-echworkers` | LuCI Web 界面管理插件 |

## 安装方法

### 方法一：添加到 OpenWrt 源码编译

```bash
# 克隆到 package 目录
cd /path/to/openwrt
git clone https://github.com/ntbowen/echworker-for-openwrt.git package/echworker-for-openwrt

# 选择包
make menuconfig
# LuCI -> Applications -> luci-app-echworkers

# 编译
make package/echworker-for-openwrt/luci-app-echworkers/compile V=s
```

### 方法二：使用 feeds

在 `feeds.conf.default` 中添加：

```
src-git echworkers https://github.com/ntbowen/echworker-for-openwrt.git
```

然后：

```bash
./scripts/feeds update echworkers
./scripts/feeds install -a -p echworkers
make menuconfig
make package/luci-app-echworkers/compile V=s
```

## 使用方法

### 透明代理（推荐）

1. 在 LuCI 界面 (服务 → ECH Workers) 配置服务器信息
2. 启用"透明代理"
3. 保存并应用
4. **完成！** LAN 下所有设备自动翻墙，无需任何客户端配置

### 手动配置代理

将设备或应用的代理设置为：
- 代理类型: SOCKS5 或 HTTP
- 代理地址: 路由器 IP
- 代理端口: 30001（或你配置的端口）

## 配置说明

详细配置说明请参考 [luci-app-echworkers/README.md](luci-app-echworkers/README.md)

## 依赖

- OpenWrt 21.02 或更高版本
- Go 1.21+ (编译时需要)
- nftables (透明代理需要)

## 许可证

MIT License

## 相关链接

- [ECH Workers 上游项目](https://github.com/byJoey/ech-wk)
- [OpenWrt](https://openwrt.org/)
- [LuCI](https://github.com/openwrt/luci)
