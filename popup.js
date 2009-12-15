var ctrl = false;
var keyD = function(e) {
    if (e.which == 17) ctrl = true;
}
var keyU = function(e) {
    if (e.which == 17) ctrl = false;
}
function mouseUP(e) {
    if (this.data)
        chrome.bookmarks.getChildren(this.data, createList);
    else if (ctrl || e.which == 2)
        newTab(this.href);
    else
        sameTab(this.href);
}

function isJsURL(url) {
    return url.substr(0, 11) == 'javascript:';
}

function newTab(url) {
    chrome.tabs.create({'url': url}, function() {});
}
function sameTab(url) {
    chrome.tabs.getSelected(null, function(tab) {
        if (isJsURL(url))
            chrome.tabs.executeScript(tab.id, {'code': url.substr(11)});
        else
            chrome.tabs.update(tab.id, {'url': url});
        window.close();
    });
}

function createList(children) {
    var blist = document.getElementById('blist');
    blist.innerHTML = '';
    children.forEach(function(b) {
        var s = document.createElement("a"), icon;
        if (b.url) {
            if (isJsURL(b.url)) icon = 'stock-script.png';
            else icon = 'http://getfavicon.appspot.com/' + b.url;
            s.href = b.url;
        } else {
            icon = 'folder.png';
            s.data = b.id;
        }
        s.onmouseup = mouseUP;
        s.innerHTML = '<img class="favicon" src="'+icon+'" /> ' + b.title;
        blist.appendChild(s);
    });
    blist.focus();
}

function init() {
    if (localStorage.qb_root) {
        chrome.bookmarks.getChildren(localStorage.qb_root, createList);
    } else {
        newTab(chrome.extension.getURL('options.html'));
        window.close();
    }
}
