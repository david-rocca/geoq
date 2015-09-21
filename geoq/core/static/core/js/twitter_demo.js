var twitterStream = {};
twitterStream.stream_open = false;
twitterStream.intervalId = undefined;
twitterStream.queryInterval = 1000 * 15;
twitterStream.tweets = [];
twitterStream.tweetFeatures = [];
twitterStream.tweetIndex = 0;
twitterStream.tweetLayer = undefined;
twitterStream.loadedLayer = undefined;
twitterStream.feature_id = 0;
twitterStream.bad_hashtags = [];


twitterStream.toggleStream = function(_button) {
    console.log("toggling stream...");

    if ( twitterStream.stream_url == undefined ||
        twitterStream.get_tweets_url == undefined ) {
            console.log("Error with ajax urls");
            return;
        }

    // Start leaflet GeoJson layer for Twitter
    if (twitterStream.tweetLayer == undefined) {
        twitterStream.tweetLayer = L.geoJson(false, {
            onEachFeature: function(feature, layer) {
                layer.bindPopup(feature.properties.popupContent);
            },
            filter: function(feature, layer) {
                return (feature.properties.lang === "en") &&
                    (feature.geometry !== null);
            },
            pointToLayer: function(feature, latlng) {
                var icon = L.icon({
                    iconSize: [32, 32],
                    iconAnchor: [13, 27],
                    iconUrl: 'http://png.findicons.com/files/icons/2823/turkuvaz_1/128/twitter.png'
                });

                return L.marker(latlng, {icon: icon});
            }
        }).addTo(aoi_feature_edit.map);
    }

    // if stream is active, close it
    if ( twitterStream.stream_open ) {
        console.log("closing stream...");
        twitterStream.$button.text("Start Stream");
        twitterStream.closeStream();
    } else {
        console.log("starting stream...");
        twitterStream.$button = _button;
        twitterStream.$button.text("Stop Stream");
        twitterStream.startStream();
        twitterStream.stream_open = true;
    }

    //twitterStream.stream_open = !this.stream_open;
}

twitterStream.startStream = function() {
    var map = aoi_feature_edit.map;
    if (map && map.getBounds().isValid()) {
        var query_bounds = map.getBounds().toBBoxString();
        twitterStream.query_bounds = query_bounds;

        setTimeout( function() {
            twitterStream.intervalId = twitterStream.getTweets();
        }, 2500 );

        twitterStream.toggleStreamAjaxFunc();

    } else {
        console.log("Invalid map or bounds!");
    }
}

twitterStream.toggleStreamAjaxFunc = function() {
    jQuery.ajax({
        type: "GET",
        url: twitterStream.stream_url,
        data: {"bounds" : twitterStream.query_bounds, "client-stream" : twitterStream.stream_open},
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(res) {
            if ( res.tweets != undefined ) {
                res.tweets = JSON.parse(res.tweets);
            }

            // Add tweets to map if tweets where returned
            if (res.tweets != undefined && res.tweets != null) {
                try {
                    res.tweets = JSON.parse(res.tweets);
                } catch(e) {
                    twitterStream.stream_open = false;
                    return;
                }

                if ( res.tweets instanceof Array && res.tweets.length > 0) {
                    twitterStream.tweets.push(res.tweets);
                    twitterStream.addTweetLayer();
                }
            }
            console.log("server response:", res);
        },
        error: function(e, msg) {
            twitterStream.closeStream();
            console.log(e.status + " - " + e.statusText + " [" + msg + "]");
            console.log(e);
        }
    }); //ajax
}

twitterStream.closeStream = function() {
    clearInterval(twitterStream.intervalId);

    twitterStream.toggleStreamAjaxFunc();
    twitterStream.stream_open = false;

    this.$button.prop("disabled", true);
    setTimeout( function() {
        twitterStream.$button.text("Start Stream");
        twitterStream.$button.prop("disabled", false);
        console.log("Ready for streaming");
    }, 5 * 1000);
}

twitterStream.getTweets = function() {
    var queryId = setInterval( function() {
        twitterStream.getTweetsAjaxFunc();
    }, this.queryInterval );

    return queryId;
}

twitterStream.getTweetsAjaxFunc = function() {
    jQuery.ajax({
        type: "GET",
        url: twitterStream.get_tweets_url,
        data: {
            //stringify array to pass to python. Had difficulties with other methods
            "bad-hashtags" : JSON.stringify(twitterStream.bad_hashtags),
            "client-stream" : twitterStream.stream_open
        },
        dataType: "json",
        success: function(res) {
            if (res.server_stream == undefined || !res.server_stream) {
                twitterStream.closeStream();
            }

            if (res.tweets != undefined && res.tweets != null) {
                res.tweets = JSON.parse(res.tweets);

                if ( res.tweets instanceof Array && res.tweets.length > 0) {
                    //twitterStream.tweets.push(res.tweets);
                    twitterStream.addTweetLayer(res.tweets);
                }
            }

            //empties array
            twitterStream.bad_hashtags.length = 0;
            console.log("server response:", res);

        },
        error: function(e, msg) {
            twitterStream.closeStream();
            console.log(e.status + " - " + e.statusText + " [" + msg + "]");
            console.log(e);
        }
    }); //ajax
}

twitterStream.addTweetLayer = function(tweetArr) {
    var features = [];

    //for (var t of twitterStream.tweets[twitterStream.tweetIndex]) {
    for (var t of tweetArr) {

        var dateStr = new Date(parseInt(t.timestamp_ms));
        var imageUrl = null;

        // Add profile pic, twitter handler, and user's name to popup
        var popupContent = '<div class="tweet-popup"><div class="tweet-popup-header">' +
                        '<img src="' + t.user.profile_image_url_https + '"/>' +
                        '<span><h5>@' + t.user.screen_name + '</h5><h6>(' + t.user.name + ')</h6></span></div>' +
                        '<p>' + t.text + '</p><p>Posted today at ' + dateStr.toLocaleTimeString() + '</p>';

        // Adds image, if one exists, to popup
        if ( ("media" in t.entities) && (t.entities.media.length > 0) ) {
            var media = t.entities.media[0];
            if ( media.type !== "photo" ) {
                return;
            }
            imageUrl = media.media_url_https;
            var image = '<div class="tweet-img"><img style="width:125;height:125;" src="'+imageUrl+'"/>' +
                        '<span><a href="#">Click to see full sized image</a></span></div>';
            popupContent = popupContent + '<p>' + image + '</p>';
        }

        // Adds removal and irrelevant buttons to popup
        popupContent += '<div data-id="' + twitterStream.feature_id + '"><a href="#" class="irrel-tweet">Flag ' +
                        'as Irrelevant</a>&nbsp;|&nbsp;<a href="#" class="remove-tweet">Remove from Map</a>' +
                        '&nbsp;|&nbsp;<a href="#" class="save-tweet">Save Tweet</a></div>';

        // Closes wrapper div
        popupContent += '</div>';

        var feature_json = {
            type: "Feature",
            properties: {
                id: twitterStream.feature_id++,
                text: t.text,
                source: 'Twitter',
                image: imageUrl,
                place: t.place,
                lang: t.lang,
                username: t.user.name,
                screen_name: t.user.screen_name,
                profile_pic_url: t.user.profile_image_url_https,
                twitter_verified: t.user.verified,
                tweet_id: t.id,
                timestamp: t.created_at,
                hashtags: t.entities.hashtags,
                tweet_data: JSON.stringify(t),
                popupContent: popupContent
            },
            // Note: coordinates field is GeoJson ready, the geo field isn't
            // Even though they share the same data (for the most part)
            geometry : t.coordinates
        }

        t.feature_json = feature_json;
        features.push(feature_json);
    }
    twitterStream.tweetIndex++;

    twitterStream.tweetLayer.addData(features);
}

twitterStream.selectTweetLayer = function($tweet) {
    var markerId = $tweet.parent().attr('data-id');
    markerId = parseInt(markerId);

    var layerList = twitterStream.tweetLayer.getLayers();
    for ( var layer of layerList ) {
        if (layer.feature.properties.id === markerId) {
            //console.log(layer);
            return layer;
        }
    }

    return null;
}

twitterStream.irrelevantTweet = function() {
    $tweet = twitterStream.selectTweetLayer($(this));
    if ( $tweet == null || $tweet == undefined ) {
        console.log("error with irrelevant tweet");
        return;
    }

    // Collect hashtags
    for ( var tag of $tweet.feature.properties.hashtags ) {
        twitterStream.bad_hashtags.push(tag.text);
    }
    twitterStream.tweetLayer.removeLayer($tweet);
}

twitterStream.removeTweet = function() {
    $tweet = twitterStream.selectTweetLayer($(this));
    if ( $tweet == null || $tweet == undefined ) {
        console.log("error with remove tweet");
        return;
    }

    twitterStream.tweetLayer.removeLayer($tweet);
}

twitterStream.saveTweet = function() {
    $tweet = twitterStream.selectTweetLayer($(this));
    if ( $tweet == null || $tweet == undefined ) {
        console.log("error with save tweet");
        return;
    }

    jQuery.ajax({
        traditional: true,
        type: "POST",
        url: twitterStream.save_tweet_url,
        data: {"tweet_data": $tweet.feature.properties.tweet_data},
        dataType: "json",
        success: function(res) {
            console.log("save tweet response:", res);
            if (res != undefined && res.tweet_saved) {
                alert("Tweet has been saved successfully!");
                twitterStream.tweetLayer.removeLayer($tweet);
            }
        },
        error: function(e, msg) {
            console.log(e.status + " - " + e.statusText + " [" + msg + "]");
            console.log(e);
        }
    }); //ajax
}

//TODO: Add lazy load logic to this call
twitterStream.loadTweets = function() {
    console.log("Loading saved tweets...");

    if ( twitterStream.loadedLayer == undefined ) {
        twitterStream.loadedLayer = L.geoJson(false, {
            onEachFeature: function(feature, layer) {
                layer.bindPopup(feature.properties.popupContent);
            },
            // This filter is redundant, could be removed to improve efficiency
            filter: function(feature, layer) {
                return (feature.properties.lang === "en") &&
                    (feature.geometry !== null);
            },
            pointToLayer: function(feature, latlng) {
                var icon = L.icon({
                    iconSize: [32, 32],
                    iconAnchor: [13, 27],
                    iconUrl: 'https://encrypted-tbn3.gstatic.com/images?q=tbn:'+
                                'ANd9GcS-s7j2twXVBwmThHkxSMwfA9S0c_k8Ug7vdJPoneZ9f9DNKGJ3'
                });

                return L.marker(latlng, {icon: icon});
            }
        }).addTo(aoi_feature_edit.map);
    }

    jQuery.ajax({
        type: "GET",
        url: twitterStream.load_tweets_url,
        dataType: "json",
        success: function(res) {
            console.log("load tweet response:", res);
            if ( res.tweets_loaded ) {
                twitterStream.onLoadSuccess(res);
            }
        },
        error: function(e, msg) {
            console.log(e.status + " - " + e.statusText + " [" + msg + "]");
            console.log(e);
        }
    }); //ajax
}

twitterStream.onLoadSuccess = function(data) {
    var features = [];
    var tweet_data = JSON.parse(data.tweet_data);

    if ( !(tweet_data instanceof Array) ) {
        var temp = tweet_data;
        tweet_data = [];
        tweet_data.push(temp);
    }

    for ( tweet of tweet_data ) {
        var t = tweet.tweet_data;
        var dateStr = new Date(parseInt(t.timestamp_ms));
        var savedDateStr = new Date(tweet.saved_at);
        // Date parsing fix
        if ( savedDateStr.getFullYear() < 2000 ) {
            savedDateStr.setFullYear( (savedDateStr.getFullYear() - 1900) + 2000 );
        }
        savedDateStr = savedDateStr.toDateString() + ' at ' + savedDateStr.toLocaleTimeString();
        var imageUrl = null;

        // Add profile pic, twitter handler, and user's name to popup
        var popupContent = '<div class="tweet-popup"><div class="tweet-popup-header">' +
                        '<img src="' + t.user.profile_image_url_https + '"/>' +
                        '<span><h5>@' + t.user.screen_name + '</h5><h6>(' + t.user.name + ')</h6></span></div>' +
                        '<p>' + t.text + '</p><p>Posted today at ' + dateStr.toLocaleTimeString() + '</p>';

        // Adds image, if one exists, to popup
        if ( ("media" in t.entities) && (t.entities.media.length > 0) ) {
            var media = t.entities.media[0];
            if ( media.type !== "photo" ) {
                return;
            }
            imageUrl = media.media_url_https;
            var image = '<div class="tweet-img"><img style="width:125;height:125;" src="'+imageUrl+'"/>' +
                        '<span><a href="#">Click to see full sized image</a></span></div>';
            popupContent = popupContent + '<p>' + image + '</p>';
        }

        // Adds removal and irrelevant buttons to popup
        /*popupContent += '<div data-id="' + twitterStream.feature_id + '"><a href="#" class="irrel-tweet">Flag ' +
                        'as Irrelevant</a>&nbsp;|&nbsp;<a href="#" class="remove-tweet">Remove from Map</a>' +
                        '&nbsp;|&nbsp;<a href="#" class="save-tweet">Save Tweet</a></div>';*/

        // Adds additional saved tweet data
        popupContent += '<p class="loaded-tweet">Saved ' + savedDateStr.substring(4) +
        ' by <a href="#">' + tweet.user + '</a></p>';

        // Closes wrapper div
        popupContent += '</div>';

        var feature_json = {
            type: "Feature",
            properties: {
                id: twitterStream.feature_id++,
                text: t.text,
                source: 'Twitter',
                image: imageUrl,
                lang: t.lang,
                username: t.user.name,
                screen_name: t.user.screen_name,
                profile_pic_url: t.user.profile_image_url_https,
                twitter_verified: t.user.verified,
                tweet_id: t.id,
                timestamp: t.created_at,
                popupContent: popupContent
            },
            // Note: coordinates field is GeoJson ready, the geo field isn't
            // Even though they share the same data (for the most part)
            geometry : t.coordinates
        }

        t.feature_json = feature_json;
        features.push(feature_json);
    }

    twitterStream.loadedLayer.addData(features);
}