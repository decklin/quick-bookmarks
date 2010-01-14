const rootId = '0';
const bbarId = '1';

var ctrl = false;

function keyDown(ev) {
    if (ev.which == 17) ctrl = true;
}

function keyUp(ev) {
    if (ev.which == 17) ctrl = false;
}

function mouseUp(ev) {
    if (this.data)
        loadBookmarks(this.data);
    else if (ctrl || ev.which == 2)
        newTab(this.href);
    else
        sameTab(this.href);
}

function isJsURL(url) {
    return url.substr(0, 11) == 'javascript:';
}

function newTab(url) {
    chrome.tabs.create({'url': url});
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

function createBookmarkAnchor(b, parent) {
    var a = document.createElement("a"), icon;
    var t = parent ? '..' : b.title;
    if (b.url) {
        if (isJsURL(b.url))
            icon = 'stock-script.png';
        else if (localStorage[b.url])
            icon = localStorage[b.url];
        else
            icon = 'http://getfavicon.appspot.com/' + b.url;
        a.href = b.url;
    } else {
        icon = parent ? 'folder-open.png' : 'folder.png';
        a.data = b.id;
    }
    a.onmouseup = mouseUp;
    a.innerHTML = '<img class="favicon" src="'+icon+'" /> ' + t;
    return a;
}

function loadBookmarks(id) {
    var blist = document.getElementById('blist');
    blist.innerHTML = '';
    if (id == rootId || id == bbarId) {
        chrome.bookmarks.getChildren(bbarId, function(children) {
            children.forEach(function(b) {
                blist.appendChild(createBookmarkAnchor(b));
            });
            blist.appendChild(document.createElement('hr'));
        });
        chrome.bookmarks.getChildren(rootId, function(children) {
            children.forEach(function(b) {
                if (b.id != bbarId)
                    blist.appendChild(createBookmarkAnchor(b));
            });
        });
    } else {
        chrome.bookmarks.get(id, function(b) {
            chrome.bookmarks.get(b[0].parentId, function(p) {
                blist.appendChild(createBookmarkAnchor(p[0], true));
                blist.appendChild(document.createElement('hr'));
            });
            chrome.bookmarks.getChildren(id, function(children) {
                children.forEach(function(b) {
                    blist.appendChild(createBookmarkAnchor(b));
                });
            });
        });
    }
    blist.focus();
}

function init() {
    loadBookmarks(rootId);
}
