include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI support for ECH Workers
LUCI_DESCRIPTION:=ECH (Encrypted Client Hello) Workers proxy client with smart routing
LUCI_DEPENDS:=+luci-base +ech-workers +dns2socks
LUCI_PKGARCH:=all

PKG_VERSION:=1.0.0
PKG_RELEASE:=4

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-echworkers/postinst
#!/bin/sh
# 设置脚本执行权限（无论是否在 sysupgrade 环境）
chmod +x $${IPKG_INSTROOT}/usr/bin/echworkers-gfwlist 2>/dev/null
chmod +x $${IPKG_INSTROOT}/usr/bin/echworkers-control 2>/dev/null
chmod +x $${IPKG_INSTROOT}/etc/init.d/echworkers 2>/dev/null
# 仅在非 sysupgrade 环境下启用服务
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/echworkers enable 2>/dev/null
}
exit 0
endef

$(eval $(call BuildPackage,luci-app-echworkers))
