//import * as crypto from "crypto";
{
	'use strict';
	const UNSAVED = 0, SAVED = 1;
	let credentials = {};

	function Vault()
	{
		let self = this;
		this.vault = [];
		chrome.storage.local.get("vault", function(result){
			self.vault = result.vault||[];
		});
	}

	Vault.prototype = {
		get: function() {
			return this.vault;
		},
		add: function(siteset) {
			this.vault.push(siteset);
			this.vault.sort(vaultSort);
			return this.save();
		},
		edit: function(idx, siteset) {
			siteset[3] = SAVED;
			this.vault[idx] = siteset;
			this.vault.sort(vaultSort);
			return this.save();
		},
		del: function(idx) {
			this.vault.splice(idx, 1);
			return this.save();
		},
		imprt: function(newVault) {
			//FIXME: merge with existing vault
			this.vault = newVault;
			this.vault.sort(vaultSort);
			return this.save();
		},
		save: function() {
			chrome.storage.local.set({"vault": this.vault});
			return this.vault;
		},
	};

	let vaultObj = new Vault();
	chrome.storage.local.get("credentials", function(result){
		credentials = result.credentials;
	});

	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if (sender.tab) //from content
		{
			if (request.action === "submit")
			{
				//[[{"hostname":"abc.nl"}],"me@gmail.com","******"]
				chrome.browserAction.setBadgeText({text: "*"});
				let url = getUrlFromHref(request.docuhref);
				let baseDomain = tlds.getBaseDomain(url.hostname);
				let siteset = [[{"hostname": baseDomain}], request.username, request.password, UNSAVED];
				vaultObj.add(siteset);
			}
		}
		else //from popup
		{
			if (request.action === "vault.get")
			{
				sendResponse(vaultObj.get());
			}
			else if (request.action === "vault.add")
			{
				let ss = request.siteset;
				if (ss.length <= 3)
					ss[3] = SAVED;
				sendResponse(vaultObj.add(ss));
			}
			else if (request.action === "vault.imprt")
			{
				sendResponse(vaultObj.imprt(request.vault));
			}
			else if (request.action === "vault.edit")
			{
				sendResponse(vaultObj.edit(request.idx, request.siteset));
				chrome.browserAction.setBadgeText({text: ""});
			}
			else if (request.action === "vault.del")
			{
				sendResponse(vaultObj.del(request.idx));
				chrome.browserAction.setBadgeText({text: ""});
			}
			else if (request.action === "credentials.set")
			{
				credentials = {"email": request.email, "passphrase": request.passphrase};
				chrome.storage.local.set({"credentials": credentials});
				//saveToServer(request.email, "pass hash FIXME", vaultObj.get());
				getFromServer(request.email, "pass hash FIXME", saveVaultFromServer);
			}
			else if (request.action === "credentials.get")
			{
				sendResponse(credentials.email);
			}
			else
			{
				console.warn("Unknown action", request.action);
			}
		}
	});

	function saveVaultFromServer(encryptedVault)
	{
		decrypt(credentials.passphrase, encryptedVault).then(function(newVault){
			//console.log("saveVaultFromServer", newVault);
			vaultObj.imprt(JSON.parse(newVault));
		});
	}

	/* http auth */
	var target = "<all_urls>";


	//see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onAuthRequired



	/*
	chrome.browserAction.onClicked.addListener(function(){ console.log("browserAction.onClicked"); });
	if ("onInstalled" in chrome.runtime) chrome.runtime.onInstalled.addListener(function(){ console.log("runtime.onInstalled"); });
	if ("onStartup" in chrome.runtime) chrome.runtime.onStartup.addListener(function(){ console.log("runtime.onStartup"); });
	chrome.tabs.onUpdated.addListener(function(){ console.log("tabs.onUpdated"); });
	*/

}
