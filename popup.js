const rootId = '0';
const bbarId = '1';

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
    chrome.tabs.create({'url': url});
}

function reuseTab(url) {
    chrome.tabs.getSelected(null, function(tab) {
        if (isJsURL(url))
            chrome.tabs.executeScript(tab.id, {'code': url.substr(11)});
        else
            chrome.tabs.update(tab.id, {'url': url});
        window.close();
    });
}

function isJsURL(url) {
    return url.substr(0, 11) == 'javascript:';
}

function popupMenu(a, ev) {
    clearMenu();

    var menu = document.getElementById('menu');
    menu.style.left = ev.clientX + 'px';
    menu.style.top = ev.clientY + 'px';
    menu.style.display = 'block';

    selected = a;
    a.setAttribute('class', 'selected');
}

function clearMenu() {
    var menu = document.getElementById('menu');
    menu.style.display = 'none';

    if (selected) {
        selected.setAttribute('class', '');
        selected = null;
    }
}

function openSelected() {
    openBookmark(selected, reuseTab);
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
    var append = function(b) {
        blist.appendChild(createBookmarkItem(b));
        // Unfortunately this needs to depend on an em being set to 13px
        // in our stylesheet since clientWidth is in pixels.
        document.body.style.width = Math.max(document.body.clientWidth,
            Math.floor(b.title.length * 13 / 2)) + 'px';
    };

    blist.innerHTML = '';
    document.body.style.width = '10em';

    if (id == rootId || id == bbarId) {
        chrome.bookmarks.getChildren(bbarId, function(children) {
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
