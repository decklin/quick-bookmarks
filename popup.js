const rootId = '0';
const bbarId = '1';
const defaultWidth = 180;
const maxWidth = 500;

var selected = null;

function itemClicked(ev) {
    if (selected) {
        clearMenu();
    } else {
        switch (ev.button) {
        case 0:
            if (ev.ctrlKey && ev.shiftKey)
                openBookmark(this, createTabSelected);
            else if (ev.ctrlKey)
                openBookmark(this, createTab);
            else
                openBookmark(this, reuseTab);
            break;
        case 1:
            openBookmark(this, createTab);
            break;
        case 2:
            popupMenu(this, ev);
            break;
        }
    }
}

function openBookmark(a, loadUrl) {
    if (a.href) {
        loadUrl(a.href);
    } else {
        var data = JSON.parse(a.data);
        loadFolder(data.id);
    }
    clearMenu();
}

function createTab(url) {
    chrome.tabs.create({url: url, selected: false});
}

function createTabSelected(url) {
    chrome.tabs.create({url: url, selected: true});
    window.close();
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
    var blist = document.getElementById('blist');
    var menu = document.getElementById('menu');
    var menuOpenTab = document.getElementById('menuOpenTab');
    var menuOpenAll = document.getElementById('menuOpenAll');

    blist.className = 'obscured';

    if (a.href) {
        menuOpenTab.style.display = 'block';
        menuOpenAll.style.display = 'none';
    } else {
        menuOpenTab.style.display = 'none';
        menuOpenAll.style.display = 'block';
    }

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
    var blist = document.getElementById('blist');
    var menu = document.getElementById('menu');

    blist.className = 'selectable';

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

function openSelectedNewTab() {
    openBookmark(selected, createTab);
}

function openSelectedChildren() {
    var data = JSON.parse(selected.data);
    chrome.bookmarks.getChildren(data.id, function(children) {
        children.forEach(function(bookmark) {
            if (bookmark.url)
                createTab(bookmark.url);
        });
    });
}

function renameSelected() {
    var data = JSON.parse(selected.data);
    var item = selected;
    var input = document.createElement('input');
    input.value = data.title;
    item.replaceChild(input, item.lastChild);
    item.onmouseup = undefined;

    input.focus();
    input.select();
    input.addEventListener('keydown', function(event) {
        if (event.keyCode === 13) {
            data.title = input.value;
            item.data = JSON.stringify(data);
            chrome.bookmarks.update(data.id, {title: data.title});
            item.replaceChild(document.createTextNode(data.title), input);
        }
        item.onmouseup = itemClicked;
    });

    clearMenu();
}

function deleteSelected() {
    var blist = document.getElementById('blist');
    var data = JSON.parse(selected.data);

    blist.removeChild(selected.parentNode);
    chrome.bookmarks.remove(data.id);

    clearMenu();
}

function createBookmarkItem(b, parent) {
    var icon, title = parent ? '..' : b.title;
    var li = document.createElement('li');
    var a = document.createElement('a');

    a.data = JSON.stringify({id: b.id, title: title});
    a.onmouseup = itemClicked;

    if (b.url) {
        a.href = b.url;
        if (isJsURL(b.url))
            icon = 'icons/script.png';
        else if (localStorage[b.url])
            icon = localStorage[b.url];
        else
            icon = 'http://getfavicon.appspot.com/' + b.url;
    } else {
        icon = parent ? 'icons/folder-open.png' : 'icons/folder.png';
    }

    a.innerHTML = '<img class="favicon" src="'+icon+'" />' + title;
    li.appendChild(a);

    return li;
}

function loadFolder(id) {
    var blist = document.getElementById('blist');
    var curLength = blist.children.length;
    var append = function(b) {
        blist.appendChild(createBookmarkItem(b));
        // Unfortunately this is a guess based on a 13px font in the CSS.
        var approxWidth = Math.floor(b.title.length * 7);
        document.body.style.width = Math.min(maxWidth,
            Math.max(document.body.clientWidth, approxWidth)) + 'px';
    };

    blist.innerHTML = '';
    document.body.style.width = defaultWidth + 'px';

    if (id === rootId || id === bbarId) {
        chrome.bookmarks.getChildren(bbarId, function(children) {
            children.forEach(append);
            blist.appendChild(document.createElement('hr'));
            chrome.bookmarks.getChildren(rootId, function(children) {
                children.forEach(function(b) {
                    if (b.id !== bbarId)
                        append(b);
                });
            });
        });
    } else {
        chrome.bookmarks.get(id, function(b) {
            chrome.bookmarks.get(b[0].parentId, function(p) {
                blist.appendChild(createBookmarkItem(p[0], true));
                blist.appendChild(document.createElement('hr'));
                chrome.bookmarks.getChildren(id, function(children) {
                    children.forEach(append);
                });
            });
        });
    }

    blist.focus();
}

function init() {
    loadFolder(rootId);
}
