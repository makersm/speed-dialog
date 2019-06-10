( function() {
    var request = window.indexedDB.open("dialog");

    var data = [
        {name: 'naver', url: 'https://naver.com', favicon: 'https://naver.com/favicon.ico'}
    ];

    var db;
    request.onupgradeneeded = function(event) {
        db = event.target.result;
        db.createObjectStore("data", { keyPath: "url"});
    }

    function getObjectStore(store_name, mode) {
        var tx = db.transaction(store_name, mode);
        return tx.objectStore(store_name);
    }
}

