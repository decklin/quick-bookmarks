const rootId = '0';
const bbarId = '1';
const defaultWidth = '180px';

var selected = null;

function itemClicked(ev) {
    switch (ev.button) {
    case 0:
        openBookmark(this, ev.ctrlKey ? createTab : reuseTab);
        break;
    case 1:
        openBookmark(this, createTab);
        break;
    case 2:
        popupMenu(this, ev);
        break;
    }
}

function openBookmark(a, loadUrl) {
    if (a.href)
        loadUrl(a.href);
    else
        loadFolder(a.data);
    clearMenu();
}

function createTab(url) {
    chrome.tabs.create({url: url, selected: false});
}

function reuseTab(url) {
    chrome.tabs.getSelected(null, function(tab) {
        if (isJsURL(url))
            chrome.tabs.executeScript(tab.id, {code: getJsCode(url)});
        else
            chrome.tabs.update(tab.id, {url: url});
        window.close();
    });
}

function isJsURL(url) {
    return url.substr(0, 11) == 'javascript:';
}

function getJsCode(url) {
    return unescape(url.substr(11));
}

function popupMenu(a, ev) {
    clearMenu();

    var menu = document.getElementById('menu');
    var menuOpenAll = document.getElementById('menuOpenAll');
    menuOpenAll.style.display = a.href ? 'none' : 'block';

    var x = Math.min(ev.clientX,
                     document.body.clientWidth - menu.clientWidth - 4);
    var y = Math.min(ev.clientY,
                     document.body.clientHeight - menu.clientHeight - 3);

    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.visibility = 'visible';

    selected = a;
    a.className = 'selected';
}

function clearMenu() {
    var menu = document.getElementById('menu');
    menu.style.top = '0';
    menu.style.left = '0';
    menu.style.visibility = 'hidden';

    if (selected) {
        selected.className = '';
        selected = null;
    }
}

function openSelected() {
    openBookmark(selected, reuseTab);
}

function openSelectedChildren() {
    chrome.bookmarks.getChildren(selected.data, function(children) {
        children.forEach(function(bookmark) {
            if (bookmark.url)
                createTab(bookmark.url);
        });
    });
}

function deleteSelected() {
    var blist = document.getElementById('blist');
    blist.removeChild(selected.parentNode);
    chrome.bookmarks.remove(selected.data);

    clearMenu();
}

function createBookmarkItem(b, parent) {
    var icon, title = parent ? '..' : b.title;
    var li = document.createElement('li');
    var a = document.createElement('a');

    a.data = b.id;
    a.onmouseup = itemClicked;

    if (b.url) {
        a.href = b.url;
        if (isJsURL(b.url))
            icon = 'stock-script.png';
        else if (localStorage[b.url])
            icon = localStorage[b.url];
        else
            icon = 'http://getfavicon.appspot.com/' + b.url;
    } else {
        icon = parent ? 'folder-open.png' : 'folder.png';
    }

    a.innerHTML = '<img class="favicon" src="'+icon+'" /> ' + title;
    li.appendChild(a);

    return li;
}

function loadFolder(id) {
    var blist = document.getElementById('blist');
    var curLength = blist.children.length;
    var append = function(b) {
        blist.appendChild(createBookmarkItem(b));
        // Unfortunately this is a guess based on a 13px font in the CSS.
        // And duplicates the max width.
        var approxWidth = Math.floor(b.title.length * 7);
        document.body.style.width = Math.min(
            500, Math.max(document.body.clientWidth, approxWidth)) + 'px';
    };

    blist.innerHTML = '';

    if (id == rootId || id == bbarId) {
        chrome.bookmarks.getChildren(bbarId, function(children) {
            // Popup implementation is weird so it's only worth resetting
            // width if the height will change.
            if (children.length + 2 > curLength)
                document.body.style.width = defaultWidth;
            children.forEach(function(b) {
                append(b);
            });
            blist.appendChild(document.createElement('hr'));
        });
        chrome.bookmarks.getChildren(rootId, function(children) {
            children.forEach(function(b) {
                if (b.id != bbarId)
                    append(b);
            });
        });
    } else {
        chrome.bookmarks.get(id, function(b) {
            chrome.bookmarks.get(b[0].parentId, function(p) {
                blist.appendChild(createBookmarkItem(p[0], true));
                blist.appendChild(document.createElement('hr'));
            });
            chrome.bookmarks.getChildren(id, function(children) {
                // Same here, except the two extra kids are at the top.
                if (children.length + 2 > curLength)
                    document.body.style.width = defaultWidth;
                children.forEach(function(b) {
                    append(b);
                });
            });
        });
    }

    blist.focus();
}

function init() {
    loadFolder(rootId);
}
