'use strict';
'require view';
'require form';
'require uci';
'require fs';
'require ui';
'require rpc';
'require poll';

var GFW_SOURCES = {
	'gfwlist': {
		name: 'GFWList (GitHub)',
		url: 'https://raw.githubusercontent.com/Loyalsoldier/v2ray-rules-dat/release/gfw.txt'
	},
	'gfwlist_mirror': {
		name: 'GFWList (jsDelivr CDN)',
		url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/gfw.txt'
	},
	'gfwlist_gitee': {
		name: 'GFWList (Gitee 国内镜像)',
		url: 'https://gitee.com/Loyalsoldier/v2ray-rules-dat/raw/release/gfw.txt'
	},
	'custom': {
		name: _('Custom URL'),
		url: ''
	}
};

var callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

function getServiceStatus() {
	return L.resolveDefault(callServiceList('echworkers'), {}).then(function(res) {
		var isRunning = false;
		try {
			isRunning = res['echworkers']['instances']['echworkers']['running'];
		} catch (e) { }
		return isRunning;
	});
}

function renderStatus(isRunning) {
	var spanTemp = '<span style="color:%s;font-weight:bold">%s</span>';
	var renderHTML;
	if (isRunning) {
		renderHTML = String.format(spanTemp, 'green', _('Running'));
	} else {
		renderHTML = String.format(spanTemp, 'red', _('Not Running'));
	}
	return renderHTML;
}

function getGfwlistStatus() {
	return fs.exec_direct('/usr/bin/echworkers-gfwlist', ['status']).then(function(res) {
		return res || _('Unable to get status');
	}).catch(function() {
		return _('GFW list script not found');
	});
}

function updateGfwlist(source, customUrl) {
	var args = ['update'];
	if (customUrl) {
		args.push(customUrl);
	} else if (source) {
		args.push(source);
	}
	return fs.exec_direct('/usr/bin/echworkers-gfwlist', args).then(function(res) {
		return res || _('Update completed');
	}).catch(function(err) {
		return _('Update failed: ') + (err.message || err);
	});
}

function getLogs() {
	// 使用更宽泛的过滤，匹配程序输出的特征标签
	return fs.exec_direct('/sbin/logread').then(function(res) {
		if (res && res.trim()) {
			// 过滤包含 ech-workers 特征标签的日志行
			var lines = res.trim().split(/\n/).filter(function(line) {
				// 匹配程序输出的特征: [启动] [代理] [ECH] [SOCKS5] [HTTP] [警告] [加载] [下载] 等
				return (line.indexOf('[启动]') !== -1 ||
				        line.indexOf('[代理]') !== -1 ||
				        line.indexOf('[ECH]') !== -1 ||
				        line.indexOf('[SOCKS5]') !== -1 ||
				        line.indexOf('[HTTP]') !== -1 ||
				        line.indexOf('[UDP]') !== -1 ||
				        line.indexOf('[警告]') !== -1 ||
				        line.indexOf('[加载]') !== -1 ||
				        line.indexOf('[下载]') !== -1 ||
				        line.indexOf('ech-workers') !== -1) &&
				       line.indexOf('procd:') === -1;
			});
			if (lines.length > 0) {
				return lines.slice(-100).join('\n');
			}
		}
		return _('No logs available');
	}).catch(function(err) {
		return _('Failed to read logs: ') + (err.message || err);
	});
}

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('echworkers'),
			getServiceStatus()
		]);
	},

	handleSaveApply: function(ev, mode) {
		return this.handleSave(ev).then(function() {
			ui.changes.apply(mode == '0');
		}).then(function() {
			// 使用控制脚本重启服务
			return fs.exec_direct('/usr/bin/echworkers-control', ['restart']);
		}).catch(function() {});
	},

	render: function(data) {
		var isRunning = data[1];
		var m, s, o;

		m = new form.Map('echworkers', _('ECH Workers'),
			_('ECH (Encrypted Client Hello) Workers proxy client with smart routing support.'));

		// 服务状态（使用轮询即时更新）
		s = m.section(form.TypedSection, '_status');
		s.anonymous = true;
		s.render = function() {
			poll.add(function() {
				return getServiceStatus().then(function(isRunning) {
					var el = document.getElementById('echworkers_status');
					if (el) {
						el.innerHTML = renderStatus(isRunning);
					}
				});
			}, 2);

			return E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title' }, _('Service Status')),
					E('div', { 'class': 'cbi-value-field', 'id': 'echworkers_status' }, renderStatus(isRunning))
				])
			]);
		};

		// 基本设置
		s = m.section(form.TypedSection, 'echworkers', _('Basic Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.rmempty = false;

		o = s.option(form.Value, 'server', _('Server Address'),
			_('ECH Workers server address, e.g. your-worker.workers.dev:443'));
		o.placeholder = 'your-worker.workers.dev:443';
		o.rmempty = false;

		o = s.option(form.Value, 'listen', _('Listen Address'),
			_('Local listen address and port'));
		o.placeholder = '127.0.0.1:30001';
		o.default = '127.0.0.1:30001';

		o = s.option(form.ListValue, 'routing', _('Routing Mode'),
			_('Traffic routing mode'));
		o.value('global', _('Global Proxy'));
		o.value('bypass_cn', _('Bypass China'));
		o.value('none', _('Direct Connect'));
		o.default = 'bypass_cn';

		// 透明代理设置
		s = m.section(form.TypedSection, 'echworkers', _('Transparent Proxy'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'transparent', _('Enable Transparent Proxy'),
			_('Automatically redirect LAN traffic through proxy'));
		o.rmempty = false;

		o = s.option(form.Value, 'tproxy_port', _('TPROXY Port'),
			_('Local port for transparent proxy'));
		o.placeholder = '12345';
		o.default = '12345';
		o.datatype = 'port';
		o.depends('transparent', '1');

		// 高级设置
		s = m.section(form.TypedSection, 'echworkers', _('Advanced Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Value, 'token', _('Token'),
			_('Authentication token (optional)'));
		o.password = true;
		o.rmempty = true;

		o = s.option(form.Value, 'ip', _('Preferred IP'),
			_('Preferred server IP to bypass DNS resolution'));
		o.placeholder = 'saas.sin.fan';
		o.rmempty = true;

		o = s.option(form.Value, 'dns', _('DoH Server'),
			_('DNS over HTTPS server for ECH query'));
		o.placeholder = 'dns.alidns.com/dns-query';
		o.default = 'dns.alidns.com/dns-query';

		o = s.option(form.Value, 'ech', _('ECH Domain'),
			_('ECH configuration domain'));
		o.placeholder = 'cloudflare-ech.com';
		o.default = 'cloudflare-ech.com';

		// GFW 列表管理
		s = m.section(form.TypedSection, 'gfwlist', _('GFW List Management'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable GFW List'),
			_('Use GFW domain list for DNS anti-pollution'));
		o.rmempty = false;
		o.default = '1';

		o = s.option(form.ListValue, 'source', _('List Source'),
			_('Select GFW list download source'));
		o.value('gfwlist', 'GFWList (Fastly CDN)');
		o.value('gfwlist_mirror', 'GFWList (jsDelivr CDN)');
		o.value('gfwlist_ghproxy', 'GFWList (GHProxy)');
		o.value('custom', _('Custom URL'));
		o.default = 'gfwlist';

		o = s.option(form.Value, 'custom_url', _('Custom URL'),
			_('Enter custom GFW list URL'));
		o.placeholder = 'https://example.com/gfwlist.txt';
		o.depends('source', 'custom');

		o = s.option(form.Flag, 'auto_update', _('Auto Update'),
			_('Automatically update GFW list periodically'));
		o.rmempty = false;
		o.default = '0';

		o = s.option(form.ListValue, 'update_interval', _('Update Interval'),
			_('How often to update the GFW list'));
		o.value('6', _('Every 6 hours'));
		o.value('12', _('Every 12 hours'));
		o.value('24', _('Every day'));
		o.value('72', _('Every 3 days'));
		o.value('168', _('Every week'));
		o.default = '24';
		o.depends('auto_update', '1');

		// GFW 列表状态和操作
		s = m.section(form.TypedSection, '_gfwlist_status');
		s.anonymous = true;
		s.render = function() {
			var statusArea = E('pre', {
				'id': 'gfwlist_status',
				'style': 'padding:10px;border-radius:4px;font-family:monospace;font-size:12px;white-space:pre-wrap;min-height:80px;'
			}, _('Loading...'));

			var updateBtn = E('button', {
				'class': 'btn cbi-button cbi-button-action',
				'click': function() {
					var source = document.querySelector('select[name="cbid.echworkers.gfwlist.source"]');
					var customUrl = document.querySelector('input[name="cbid.echworkers.gfwlist.custom_url"]');
					var sourceVal = source ? source.value : 'gfwlist';
					var urlVal = (sourceVal === 'custom' && customUrl) ? customUrl.value : '';
					
					statusArea.textContent = _('Updating...');
					updateBtn.disabled = true;
					
					updateGfwlist(sourceVal, urlVal).then(function(res) {
						statusArea.textContent = res;
						updateBtn.disabled = false;
					});
				}
			}, _('Update Now'));

			var refreshBtn = E('button', {
				'class': 'btn cbi-button',
				'style': 'margin-left:10px;',
				'click': function() {
					statusArea.textContent = _('Loading...');
					getGfwlistStatus().then(function(res) {
						statusArea.textContent = res;
					});
				}
			}, _('Refresh Status'));

			// 初始加载状态
			getGfwlistStatus().then(function(res) {
				statusArea.textContent = res;
			});

			return E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('GFW List Status')),
				E('div', { 'style': 'margin-bottom:10px;' }, [
					updateBtn,
					refreshBtn
				]),
				statusArea
			]);
		};

		// 日志区域
		s = m.section(form.TypedSection, '_logs', _('Service Logs'));
		s.anonymous = true;
		s.render = function() {
			var logTextarea = E('textarea', {
				'id': 'echworkers_logs',
				'style': 'width:100%;height:300px;font-family:monospace;font-size:12px;resize:vertical;',
				'readonly': 'readonly',
				'wrap': 'off'
			});

			var refreshBtn = E('button', {
				'class': 'btn cbi-button cbi-button-action',
				'click': function() {
					getLogs().then(function(logs) {
						logTextarea.value = logs;
						logTextarea.scrollTop = logTextarea.scrollHeight;
					});
				}
			}, _('Refresh Logs'));

			var clearBtn = E('button', {
				'class': 'btn cbi-button',
				'style': 'margin-left:10px;',
				'click': function() {
					logTextarea.value = '';
				}
			}, _('Clear'));

			var autoRefreshLabel = E('label', { 'style': 'margin-left:20px;' }, [
				E('input', {
					'type': 'checkbox',
					'id': 'auto_refresh',
					'change': function(ev) {
						if (ev.target.checked) {
							poll.add(function() {
								return getLogs().then(function(logs) {
									var textarea = document.getElementById('echworkers_logs');
									if (textarea) {
										textarea.value = logs;
										textarea.scrollTop = textarea.scrollHeight;
									}
								});
							}, 3);
						} else {
							poll.remove(function() {});
							poll.stop();
						}
					}
				}),
				' ',
				_('Auto refresh (3s)')
			]);

			// 初始加载日志
			getLogs().then(function(logs) {
				logTextarea.value = logs;
				logTextarea.scrollTop = logTextarea.scrollHeight;
			});

			return E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Service Logs')),
				E('div', { 'style': 'margin-bottom:10px;' }, [
					refreshBtn,
					clearBtn,
					autoRefreshLabel
				]),
				logTextarea
			]);
		};

		return m.render();
	}
});
