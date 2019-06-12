$( function() {
    const STORE_NAME = "favorites";
    const FAVICON_URL = "https://www.google.com/s2/favicons?domain=";     //favicon = FAVICON_URL + dataFormat.url
    var request = window.indexedDB.open("dial", 2);

    // example
    var data = [
        {name: 'naver', url: 'https://naver.com', favicon: 'https://naver.com/favicon.ico'}
    ];

    const dataFormat = {
        name: null,
        url: null,
        favicon: null
    };

    const rowFormat = '<div class="row">{0}</div>';
    const cardFormat = '<div class="card col-md-3" onclick="javascript:moveTofavorites(\'{2}\')" data-url="{3}">\n' +
        '                <img src="{0}" class="card-img-top favorite" alt="...">\n' +
        '                <div class="card-body">\n' +
        '                    <p class="card-text">{1}</p>\n' +
        '                </div>\n' +
        '            </div>';
    const addFavoritesIconFormat = '<div class="card col-md-3" id="addFavorites">\n' +
        '                <img src="./img/plus_icon.png" class="card-img-top" alt="...">\n' +
        '            </div>';

    $(document).on('click', '#addFavorites', showAddFavoritesModal);
    $(document).on('click', '#saveFavorites', addFavorites);

    /** database section **/
    var db;
    request.onupgradeneeded = function(event) {
        db = event.target.result;
        db.createObjectStore(STORE_NAME, { keyPath: "url"});
    };

    request.onsuccess = function(event) {
        db = request.result;
        display();
    };

    request.onerror = function() {
        alert('error');
    };

    function getObjectStore(store_name, mode) {
        var tx = db.transaction(store_name, mode);
        return tx.objectStore(store_name);
    }


    /** common **/
    String.format = function() {
        let theString = arguments[0];
        for (let i = 1; i < arguments.length; i++) {
            let regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
            theString = theString.replace(regEx, arguments[i]);
        }
        return theString;
    };

    /** event listener section **/
    function showAddFavoritesModal() {
        $('#exampleModalCenter').modal('show');
    }

    function addFavorites() {
        let url = $('input[name="url"]').val();
        let name = $('input[name="name"]').val();

        if(url.length === 0 || name.length === 0) {
            url.length === 0 ? $('#basic-url').css('border-color', 'orangered') : $('#basic-url').css('border-color', 'inherit');
            name.length === 0 ? $('#basic-name').css('border-color', 'orangered') : $('#basic-name').css('border-color', 'inherit');

            return;
        }

        if(!isURL(url)) {
            $('#basic-url').css('border-color', 'orangered');
            return;
        }

        if(url.includes('https://') === false && url.includes('http://') === false) {
            url ='https://'+url;
        }

        $('#basic-url').css('border-color', 'inherit');
        $('#basic-name').css('border-color', 'inherit');

        let objectStore = getObjectStore([STORE_NAME], "readwrite");

        let data = $.extend({}, dataFormat);
        data['url'] = url;
        data['name'] = name;
        data['favicon'] = FAVICON_URL+data['url'];

        let result = objectStore.add(data);

        result.onsuccess = function(e) {
            console.log("success");
            $('input[name="url"]').val('');
            $('input[name="name"]').val('');
            $('#exampleModalCenter').modal('hide');
            display();
        };

        result.onerror = function(e) {
            console.log("error::"+e.target.error.name);
        };
    }

    /** display **/
    function display() {
        var store = getObjectStore([STORE_NAME], "readonly");

        $('.icons').empty();

        let req = store.openCursor();

        let i = 0;
        let cardlist = [];
        req.onsuccess = function(evt) {
            let cursor = evt.target.result;

            // If the cursor is pointing at something, ask for the data
            if (cursor) {
                req = store.get(cursor.key);
                req.onsuccess = function (evt) {
                    let value = evt.target.result;
                    let card = String.format(cardFormat, value['favicon'], value['name'], value['url'], value['url']);
                    cardlist.push(card);
                };

                if(i !== 0 && i % 4 === 0) {
                    let cards = cardlist.join('');
                    let value = String.format(rowFormat, cards);
                    let row = $(value);
                    $('.icons').append(row);
                    cardlist = [];
                }

                i++;
                // move to next
                cursor.continue();
            } else {
                cardlist.push(addFavoritesIconFormat);
                let cards = cardlist.join('');
                let value = String.format(rowFormat, cards);
                let row = $(value);
                $('.icons').append(row);
                cardlist = [];

                console.log("No more entries");
            }
        };
    }

    function isURL(str) {
        var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[\\%-a-z\\d_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[\\/\\%-a-z\\d_]*)?$','i'); // fragment locator
        return !!pattern.test(str);
    }

    /** search button **/
    $('#search').on('click', function() {
        let text = $('input[name="searchText"]').val();
        $('input[name="searchText"]').val('');
        if(isURL(text)) {
            location.href = text.includes('https://') === false && text.includes('http://') === false ?
                'https://'+text : text;
            return;
        }

        let query ='http://www.google.com/search?q=' + text;
        location.href = query;
    });

    var pressTimer;
    $(document).on('contextmenu', 'img.favorite', function(event){
        // Set timeout
        event.preventDefault();
        var targetImg = $(event.target);

        let objectStore = getObjectStore([STORE_NAME], "readwrite");
        let url = targetImg.parent().attr('data-url');
        targetImg.parent().remove();

        let result = objectStore.delete(url);
        result.onsuccess = function(e) {
            console.log("success");
            display();
        };

        result.onerror = function(e) {
            console.log("error::"+e.target.error.name);
        };
        return false;
    });
} );

function moveTofavorites(url) {
    window.location.href = url;
}
