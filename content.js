(function(){

function getPasswordInput()
{
	return document.querySelector('form[method="post" i] input[type="password"]');
}
function getUsernameInput(passwordInput)
{
	let formElems = passwordInput.form.elements;
	let i = formElems.length;
	let passSeen = false;
	while (--i)
	{
		if (passSeen)
			if (formElems[i].type === "text")
				return formElems[i];
		if (formElems[i] == passwordInput)
			passSeen = true;
	}
}

/* messaging */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse)
{
	if (message.type === 'hasLoginForm')
	{
		return sendResponse(getPasswordInput() != null);
	}
	else if (message.type === 'fillLoginForm')
	{
		let passwordInput = getPasswordInput();
		if (passwordInput != null)
		{
			passwordInput.value = message.pass;
			let usernameInput = getUsernameInput(passwordInput);
			if (usernameInput)
				usernameInput.value = message.user;
			else
				console.error("Unable to find usernameInput from passwordInput", passwordInput);
			passwordInput.form.submit();
			return sendResponse(true);
		}
		return sendResponse(false);
	}
});




})();