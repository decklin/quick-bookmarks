// This is a really nasty kludge until we can load from chrome://favicon/
// (#11854). The API here sucks. We could attach a callback to tabs.create
// or tabs.update, but that will return a useless copy of the just-created
// Tab object (#24558). We can't provide a callback to fire when the tab
// actually completes and favIconUrl is available. So, we watch every
// single tab update to see if it contains something of interest. To avoid
// bloating localStorage we filter this on actually-bookmarked URLs. We
// can update *that* list when a bookmark is created, but on deletion...
// fuck it. This is good enough. It's just a hack. I will delete the entire
// file with much relish. Hopefully soon.

var watching = {};

function watchAll(bookmarks) {
    bookmarks.forEach(function(b) {
        if ('children' in b)
            watchAll(b.children);
        else
            watching[b.url] = true;
    });
}
chrome.bookmarks.getTree(watchAll);
chrome.bookmarks.onCreated.addListener(function(id, b) {
    watching[b.url] = true;
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (tab.url in watching && tab.status == 'complete' && tab.favIconUrl)
        localStorage[tab.url] = tab.favIconUrl;
});
