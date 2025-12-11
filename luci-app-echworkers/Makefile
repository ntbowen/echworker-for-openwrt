include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI support for ECH Workers
LUCI_DESCRIPTION:=ECH (Encrypted Client Hello) Workers proxy client with smart routing
LUCI_DEPENDS:=+luci-base +ech-workers +dns2socks
LUCI_PKGARCH:=all

PKG_VERSION:=1.0.0
PKG_RELEASE:=3

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-echworkers/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	chmod +x /usr/bin/echworkers-gfwlist 2>/dev/null
	chmod +x /usr/bin/echworkers-control 2>/dev/null
	chmod +x /etc/init.d/echworkers 2>/dev/null
	/etc/init.d/echworkers enable 2>/dev/null
}
exit 0
endef

$(eval $(call BuildPackage,luci-app-echworkers))
