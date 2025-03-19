YUI().use("node", "test-console", function (Y) {
	
	Y.on("domready", init); 
	
	function init()
	{
		var useNative = !!getParameterFromUrl(location.href, "native"),
			useXml = !!getParameterFromUrl(location.href, "xml"),
			// it is better handled at modern static file servers
			testUrl = "tests." + (useXml ? "xhtml" : "html") + "?native=" + ((useNative) ? 1 : 0)
		;
		
		// highlight current settings
		Y.one(".setting" + ((useNative) ? 1 : 0) + ((useXml) ? 1 : 0))
			.addClass("setting-current")
		;
		
		var iframe = Y.one(document.createElement('iframe'))
				.setStyle('display', 'none')
				.appendTo(Y.one("#testContainer")),
			iframeLoaded = function() {
				attachScripts(iframe._node.contentWindow, useNative, useXml);
			}
		;
		
		// @see http://www.nczonline.net/blog/2009/09/15/iframes-onload-and-documentdomain/
		if (iframe._node.attachEvent) {
			iframe._node.attachEvent("onload", iframeLoaded);
		} else {
			iframe.set('onload', iframeLoaded);
		}
		
		iframe.set('src', testUrl);
	}
	
	function attachScripts(win, useNative, useXml) {
		var scripts = [
			"https://yui-s.yahooapis.com/3.5.0/build/yui/yui-min.js",
			"tests.js"
		];
		
		// not required anymore; using ES module imports
		// if (!useNative) {
		// 	// scripts.push("../dist/xpathjs.js");
		// 	scripts.push("../dist/parser.js");
		// }
		
		// load all xpath scripts for this library

		let toks = []

		async function onAllSuccess() {
				console.log('on all success')
				// remove script tags
				toks.forEach(e => e.purge());

				if (!useNative) {
					// initialize xpathjs
					console.log('loading xpathjs');
					const xp = await import("../dist/xpathjs.js");
					console.log('xpathjs is loaded');
					const bindings = xp.createDomLevel3XPathBindings({
						// it is on by default
						withNonstandardUtilities: false,
						'case-sensitive': (useXml) ? true : false
					});
					Object.assign(win.window, bindings.window);
					Object.assign(win.document, bindings.document);
				}

				runTests(win);
		}

		scripts.forEach((s) => {
			Y.Get.script(s, {
				attributes: s.match(/^http/) ? {} : { type: "module" },
				onSuccess: (e) => {
					toks.push(e);
					if (toks.length === scripts.length) {
						onAllSuccess();
					}
				},
				win,
			});
		});

	}

	function runTests(win) {
		//create the console
		var r = new Y.Test.Console({
			newestOnTop : false,
			style: 'inline', // to anchor in the example content
			height: '500px',
			width: '100%',
			consoleLimit: 1000,
			filters: {
				pass: true
			}
		});
		
		/**
		 * @see http://yuilibrary.com/projects/yui3/ticket/2531085
		 */
		Y.Console.FOOTER_TEMPLATE = Y.Console.FOOTER_TEMPLATE.replace('id="{id_guid}">', 'id="{id_guid}" />');
		
		r.render('#testLogger');
		
		win.YUI({useBrowserConsole: false}).use('xpathjs-test', "node", "test", "event", function (Y2) {
			
			Y2.on("yui:log", function(e) {
				Y.log(e.msg, e.cat, e.src);
			});
			
			Y2.Test.Runner.add(Y2.XPathJS.Test.generateTestSuite(win, win.document, win.document.evaluate));
		
			//run the tests
			Y2.Test.Runner.run();
		});
	}
	
	function getParameterFromUrl(url, param) {
		var regexp = new RegExp("(?:\\?|&)" + param + "(?:$|&|=)([^&#]*)"),
			value = regexp.exec(url)
		;
		
		if (value === null)
			return 0;
		
		return parseInt(value[1]);
	}
});
