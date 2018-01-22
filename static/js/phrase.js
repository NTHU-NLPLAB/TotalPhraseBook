var $ = function(id){return document.getElementById(id);};
function isChinese(str)
{
	for(var i in str)
		if(/[\u4E00-\u9FFF]/.test(str[i]))
			return true;
	return false;
}

function drawPhraseTable(phraseObj, offset)
{
	var html = "";
	if(offset > 0)
		html += '<li class="page_control" onclick="queryPhrase(' + (offset-8) + ');">Previous 8 phrases</li>';
	for(var i in phraseObj)
	{
		html += '<li onclick="querySentence(this);" ';
		html += 'cphrase="' + phraseObj[i][0] + '" ';
		html += 'ephrase="' + phraseObj[i][1] + '" ';
		html += 'cealign="' + phraseObj[i][2] + '" ';
		html += 'ecalign="' + phraseObj[i][3] + '" ';
		html += 'cce="' + phraseObj[i][9] + '" ';
		html += 'cc="' + phraseObj[i][10] + '" ';
		html += 'ce="' + phraseObj[i][11] + '" ';
		html += '>';
		html += '<div class="info" title="p(c|e), p(e|c), significance score">(' + phraseObj[i][4].toFixed(3) + ', ' + phraseObj[i][6].toFixed(3) + ', ' + phraseObj[i][12].toFixed(3) + ')</div>';
		html += '<div class="cphrase">' + phraseObj[i][13] + '</div>';
		html += '<div class="ephrase">' + phraseObj[i][1] + '</div></li>';
	}
	if(phraseObj.length >= 8)
		html += '<li class="page_control" onclick="queryPhrase(' + (offset+8) + ');">Next 8 phrases</li>';
	$("ul-phrase").innerHTML = html;
	if(phraseObj.length == 0)
		$("panel-phrase-no-result").style.display = "block";
	else
		$("panel-phrase-no-result").style.display = "none";

	$("panel-phrase").style.display = "block";
	$("panel-tip").style.display = "block";
	$("img-tip").src = "static/img/arrow-left.png";
	$("panel-sentence").innerHTML = "";
}
function querySentence(phraseElm)
{
	for(var i in phraseElm.parentNode.childNodes)
		if(phraseElm.parentNode.childNodes[i].className != "page_control")
			phraseElm.parentNode.childNodes[i].className = "";
	phraseElm.className = "selected";
	var ch = phraseElm.getAttribute("cphrase");
	var en = phraseElm.getAttribute("ephrase");
	var sUrl = "sentence?ch=" + Url.encode(ch) + "&en=" + Url.encode(en);
	var callback =
	{
		success:qs_responseSuccess,
		failure:qs_responseFailure,
		argument:[ch, en]
	};
	var transaction = YAHOO.util.Connect.asyncRequest('GET', sUrl, callback, null); 
	$("q").style.backgroundImage = "url(static/img/loading.gif)";

	var html = "<ul>"
	html += "<li>cealign:" + phraseElm.getAttribute("cealign").replace("()", "<font color='#CC0000'>()</font>") + " " + phraseElm.getAttribute("cphrase") +"</li>";
	html += "<li>ecalign:" + phraseElm.getAttribute("ecalign").replace("()", "<font color='#CC0000'>()</font>") + "</li>";
	html += "<li>count(c,e):" + phraseElm.getAttribute("cce") + "</li>";
	html += "<li>count(c):" + phraseElm.getAttribute("cc") + "</li>";
	html += "<li>count(e):" + phraseElm.getAttribute("ce") + "</li>";
	html += "</ul>";
	$("panel-info").innerHTML = html;
	$("panel-info").style.display = "block";
	return false;
}
function mouseoverWord(spanObj)
{
	var index = 0;
	for(;spanObj.parentNode.childNodes[index] != spanObj; ++index);
	spanObj.className = "highlight";
	var alg = spanObj.parentNode.parentNode.getAttribute("alignment").split(" ");
	if(spanObj.parentNode.previousSibling)
	{
		// en
		for(var i in alg)
		{
			tok = alg[i].split("-");
			if(parseInt(tok[1]) == index)
				spanObj.parentNode.previousSibling.childNodes[parseInt(tok[0])].className = "highlight";
		}
	}
	else
	{
		// ch
		for(var i in alg)
		{
			tok = alg[i].split("-");
			if(parseInt(tok[0]) == index)
				spanObj.parentNode.nextSibling.childNodes[parseInt(tok[1])].className = "highlight";
		}
	}
}
function mouseoutWord(spanObj)
{
	spanObj.className = "";
	if(spanObj.parentNode.previousSibling)
		for(var i in spanObj.parentNode.previousSibling.childNodes)
			spanObj.parentNode.previousSibling.childNodes[i].className = "";
	if(spanObj.parentNode.nextSibling)
		for(var i in spanObj.parentNode.nextSibling.childNodes)
			spanObj.parentNode.nextSibling.childNodes[i].className = "";
}
function drawSentence(sentenceObj, keywords)
{
	var ch = " " + keywords[0] + " ";
	var en = " " + keywords[1] + " ";
	var html = "<ul>";
	for(var i in sentenceObj)
	{
		html += '<li alignment="' + sentenceObj[i][2];
		html += '"><div class="csentence">';
		s = sentenceObj[i][0].split(" ");
		for(var c in s)
			if(ch.indexOf(" " + s[c] + " ") >= 0)
				html += '<span onmouseover="mouseoverWord(this);" onmouseout="mouseoutWord(this);"><em>' + s[c] + '</em></span>';
			else
				html += '<span onmouseover="mouseoverWord(this);" onmouseout="mouseoutWord(this);">' + s[c] + '</span>';
		html += '</div>';
		html += '<div class="esentence">';
		s = sentenceObj[i][1].split(" ");
		for(var c in s)
			if(en.indexOf(" " + s[c] + " ") >= 0)
				html += '<span class="keyword" onmouseover="mouseoverWord(this);" onmouseout="mouseoutWord(this);"><em>' + s[c] + '&nbsp;</em></span>';
			else
				html += '<span onmouseover="mouseoverWord(this);" onmouseout="mouseoutWord(this);">' + s[c] + '&nbsp;</span>';
		html += '</div></li>';
	}
	html += "</ul>";
	$("panel-tip").style.display = "none";
	$("panel-sentence").innerHTML = html;
}

function qs_responseSuccess(o)
{
	$("q").style.backgroundImage = "none";
	if(o.status == 200)
	{
		var sentenceObj = eval("(" + o.responseText + ")");
		drawSentence(sentenceObj, o.argument);
	}
/* Please see the Success Case section for more
 * details on the response object's properties.
 * o.tId
 * o.status
 * o.statusText
 * o.getResponseHeader[ ]
 * o.getAllResponseHeaders
 * o.responseText
 * o.responseXML
 * o.argument
 */
}

function qs_responseFailure(o)
{
// Access the response object's properties in the
// same manner as listed in responseSuccess( ).
// Please see the Failure Case section and
// Communication Error sub-section for more details on the
// response object's properties.
}

function qp_responseSuccess(o)
{
	$("q").style.backgroundImage = "none";
	if(o.status == 200)
	{
		var phraseObj = eval("(" + o.responseText + ")");
		drawPhraseTable(phraseObj, o.argument[1]);
	}
/* Please see the Success Case section for more
 * details on the response object's properties.
 * o.tId
 * o.status
 * o.statusText
 * o.getResponseHeader[ ]
 * o.getAllResponseHeaders
 * o.responseText
 * o.responseXML
 * o.argument
 */
}

function qp_responseFailure(o)
{
// Access the response object's properties in the
// same manner as listed in responseSuccess( ).
// Please see the Failure Case section and
// Communication Error sub-section for more details on the
// response object's properties.
}


function queryPhrase(offset)
{
	if(offset === undefined)
		offset = 0;
	var sUrl = "phrase/" + Url.encode($("q").value) + "?offset=" + offset;
	var callback =
	{
		success:qp_responseSuccess,
		failure:qp_responseFailure,
		argument:[$("q").value, offset]
	};
	var transaction = YAHOO.util.Connect.asyncRequest('GET', sUrl, callback, null);
	$("q").style.backgroundImage = "url(static/img/loading.gif)";
	$("panel-info").style.display = "none";
	return false;
}
function init()
{
	$("q").focus();
	if(location.href.indexOf("?") >= 0)
	{
		$("q").value = unescape(location.href.split("?")[1]);
		queryPhrase();
	}
}
