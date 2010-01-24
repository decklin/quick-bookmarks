const rootId = '0';
const bbarId = '1';

function mouseUp(ev) {
    if (this.data)
        loadBookmarks(this.data);
    else if (ev.ctrlKey || ev.which == 2)
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

function deleteItem(ev) {
    var blist = document.getElementById('blist');
    blist.removeChild(this.parentNode);
    chrome.bookmarks.remove(this.data);
}

function createBookmarkItem(b, parent) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    var del = document.createElement('img');
    var icon, title = parent ? '..' : b.title;

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
    a.innerHTML = '<img class="favicon" src="'+icon+'" /> ' + title;
    li.appendChild(a);

    if (b.url) {
        del.src = 'delete.png';
        del.setAttribute('class', 'delete');
        del.data = b.id;
        del.onmouseup = deleteItem;
        li.appendChild(del);
    }

    return li;
}

function loadBookmarks(id) {
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
    loadBookmarks(rootId);
}
