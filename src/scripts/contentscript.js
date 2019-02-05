import ext from "./utils/ext";

var currentScrollPosition = 0,
    lastCollectedInterval = -1,
    collectorInterval = 100,
    rects = {},
    initiated = false;

function stateUpdated(_oEvent) {
    //update icon
    ext.runtime.sendMessage({
            "action":"updateIcon",
            "facebookopen": (document.location.href == 'https://www.facebook.com/' ? 'true' : 'false')
        });

    //reset session
    ext.runtime.sendMessage({
            action: 'opened-facebook'
        }, function() {
            initiated = true;
            scrollHandler();
        });
}

function scrollHandler() {
    if(!initiated) {
        return;
    }

    //collect all elements' top positions (if an element has an ID)
    document.querySelectorAll('[id]').forEach(function(domElem) {
        if (typeof(rects[domElem.id]) == 'undefined') {
            rects[domElem.id] = domElem.getBoundingClientRect();
        }
    });
    rects['body'] = document.body.getBoundingClientRect();

    //respond to the server
    ext.runtime.sendMessage({
        action: 'process-feed',
        data: document.body.innerHTML,
        rect: JSON.stringify(rects),
        scrolledUntil:lastCollectedInterval*collectorInterval
    }, function(response){

        //set up interaction handlers
        ext.runtime.sendMessage({action: 'getInteractionSelectors'}, function (interactionSelectors) {
            for (var i = 0; i < interactionSelectors.length; i++) {
                var interactionElements = document.querySelectorAll(interactionSelectors[i].totalCss);
                for (var j = 0; j < interactionElements.length; j++) {
                    var postElem = interactionElements[j];
                    while ((postElem = postElem.parentElement)) {
                        if (postElem.matches(interactionSelectors[i].postCss)) {
                            if (!interactionElements[j].hasAttribute('data-postid')) {
                                interactionElements[j].setAttribute('data-postid', postElem.id);
                                interactionElements[j].setAttribute('data-configcolumn', interactionSelectors[i].configColumn);
                                interactionElements[j].setAttribute('data-attr', interactionSelectors[i].attribute);
                                interactionElements[j].addEventListener(interactionSelectors[i].event, interactionHandler);
                            }
                            break;
                        }
                    }
                }
            }
        });
    });
}

function interactionHandler(event) {
    var postID = event.target.attributes["data-postid"].value,
        configColumn = event.target.attributes["data-configcolumn"].value,
        attributeSelector = event.target.attributes['data-attr'].value,
        attribute = getAttribute(attributeSelector, event.target),
        interaction = {
            'action': 'interaction',
            'id': postID,
            'column': configColumn,
            'attribute': attribute
        };
    ext.runtime.sendMessage(interaction, function(result){} );
}

function getAttribute(attribute, domNode){
    if (attribute.startsWith("attr-")){
        return domNode.getAttribute(attribute.substr(5,attribute.length-5));
    } else{
        if (attribute.startsWith("data-")){
            var dataObjStr = attribute.substr(5,attribute.length-5);
            return domNode.dataset[dataObjStr];
        } else {
            if (attribute.startsWith("static-")){
                var dataObjStr = attribute.substr(7,attribute.length-7);
                return domNode.dataset.dataObjStr;
            } else {
                switch (attribute) {
                    case 'text':
                        return domNode.innerText;
                        break;
                    case 'html':
                        return domNode.innerHTML;
                        break;
                    case 'exists':
                        return true;
                        break;

                    default:
                        break;
                }
            }
        }
    }
}


window.addEventListener('scroll', function(_oEvent) {
    currentScrollPosition = document.body.getBoundingClientRect().top *(-1);
    var currentInterval = Math.floor(currentScrollPosition/collectorInterval);
    if(currentInterval != lastCollectedInterval && initiated) {
        scrollHandler();
        lastCollectedInterval = currentInterval;
    }
});


window.addEventListener('load', function() {
    // allow stateUpdated() before unload (i.e., before clicking an outgoing link)
    document.head.appendChild(document.createElement('script')).text = '(' +
        function () {
            var _pushState = history.pushState,
                _replaceState = history.replaceState;
            history.pushState = function (state, title, url) {
                stateUpdated();
                _pushState.call(this, state, title, url);
            };
            history.replaceState = function (state, title, url) {
                stateUpdated();
                _replaceState.call(this, state, title, url);
            };
        } + ')();' +
        // remove the DOM script element
        'if(typeof(this.remove) !== \'undefined\') this.remove();';
    stateUpdated();
});


window.addEventListener('beforeunload', function () {
    stateUpdated();
});
