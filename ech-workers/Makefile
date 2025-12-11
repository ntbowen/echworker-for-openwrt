include $(TOPDIR)/rules.mk

PKG_NAME:=ech-workers
PKG_VERSION:=1.4
PKG_RELEASE:=4

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/byJoey/ech-wk.git
PKG_SOURCE_VERSION:=main
PKG_MIRROR_HASH:=skip

PKG_LICENSE:=MIT
PKG_MAINTAINER:=Zag

PKG_BUILD_DEPENDS:=golang/host
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

# 中国 IP 列表下载定义
define Download/china-ip-v4
  URL:=https://raw.githubusercontent.com/mayaxcn/china-ip-list/master/
  URL_FILE:=chn_ip.txt
  FILE:=china-ip-v4.txt
  HASH:=skip
endef

define Download/china-ip-v6
  URL:=https://raw.githubusercontent.com/mayaxcn/china-ip-list/master/
  URL_FILE:=chn_ip_v6.txt
  FILE:=china-ip-v6.txt
  HASH:=skip
endef

define Package/ech-workers
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Web Servers/Proxies
  TITLE:=ECH Workers Proxy Client
  URL:=https://github.com/ntbowen/ech-wk
  DEPENDS:=$(GO_ARCH_DEPENDS) +ca-bundle
endef

define Package/ech-workers/description
  ECH (Encrypted Client Hello) Workers proxy client.
  Supports SOCKS5, HTTP CONNECT and TPROXY protocols with smart routing
  (global proxy, bypass China, direct connect).
  Includes pre-downloaded China IP lists for bypass_cn routing mode.
endef

define Build/Prepare
	$(call Build/Prepare/Default)
	# 复制 TPROXY 支持文件
	$(CP) $(CURDIR)/files/tproxy_linux.go $(PKG_BUILD_DIR)/
	# 修改主程序添加 TPROXY 支持
	# 1. 添加 tproxy flag
	$(SED) 's|flag.StringVar(&routingMode, "routing"|flag.StringVar(\&tproxyAddr, "tproxy", "", "TPROXY 透明代理监听地址")\n\tflag.StringVar(\&routingMode, "routing"|' $(PKG_BUILD_DIR)/ech-workers.go
	# 2. 在 runProxyServer 前启动 TPROXY
	$(SED) 's|runProxyServer(listenAddr)|if tproxyAddr != "" { go runTProxyServer(tproxyAddr) }\n\trunProxyServer(listenAddr)|' $(PKG_BUILD_DIR)/ech-workers.go
	# 3. 在 sendSuccessResponse 中添加 modeTProxy case
	$(SED) 's|case modeHTTPProxy:|case modeTProxy:\n\t\treturn nil\n\tcase modeHTTPProxy:|' $(PKG_BUILD_DIR)/ech-workers.go
	# 上游没有 go.mod，需要创建
	cd $(PKG_BUILD_DIR) && \
		$(STAGING_DIR_HOSTPKG)/bin/go mod init ech-workers && \
		$(STAGING_DIR_HOSTPKG)/bin/go mod tidy
endef

define Build/Compile
	cd $(PKG_BUILD_DIR) && \
		CGO_ENABLED=0 \
		GOOS=linux \
		GOARCH=$(GO_ARCH) \
		$(STAGING_DIR_HOSTPKG)/bin/go build \
		-trimpath \
		-ldflags "-s -w" \
		-o $(PKG_BUILD_DIR)/ech-workers \
		.
endef

define Package/ech-workers/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/ech-workers $(1)/usr/bin/ech-workers
	# 安装中国 IP 列表到数据目录
	$(INSTALL_DIR) $(1)/usr/share/ech-workers
	$(INSTALL_DATA) $(DL_DIR)/china-ip-v4.txt $(1)/usr/share/ech-workers/chn_ip.txt
	$(INSTALL_DATA) $(DL_DIR)/china-ip-v6.txt $(1)/usr/share/ech-workers/chn_ip_v6.txt
endef

$(eval $(call Download,china-ip-v4))
$(eval $(call Download,china-ip-v6))
$(eval $(call BuildPackage,ech-workers))
