import ext from "./utils/ext";

var interactionSelectors = [],
    currentScrollPosition = 0,
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
    }, function(response){});

    //set up interaction handlers
    ext.runtime.sendMessage({action:'getInteractionSelectors'}, function(res){
        interactionSelectors = res;
    });
    for (var i=0; i< interactionSelectors.length;i++) {
        var posts = document.querySelectorAll(interactionSelectors[i].parentCss);
        for (var u=0;u< posts.length; u++){
            var res = posts[u].querySelectorAll(interactionSelectors[i].css);
            for (var e = 0; e < res.length; e++) {
                res[e].setAttribute('parentID', posts[u].id);
                res[e].setAttribute('configColumn',interactionSelectors[i].configColumn);
                res[e].setAttribute('attributeSelector',interactionSelectors[i].attribute);
                res[e].removeEventListener(interactionSelectors[i].event, interactionEventHandler);
                res[e].addEventListener(interactionSelectors[i].event, interactionEventHandler);
            }
        }
    }
}

function interactionEventHandler(event) {
    var parentID = event.target.attributes["parentID"].value,
        configColumn = event.target.attributes["configColumn"].value,
        attributeSelector = event.target.attributes['attributeSelector'].value,
        attribute = getAttribute(attributeSelector, event.target),
        interaction = {
            'action': 'interaction',
            'id': parentID,
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


window.addEventListener('state-changed', stateUpdated);
window.addEventListener('scroll', function(_oEvent) {
        currentScrollPosition = document.body.getBoundingClientRect().top *(-1);
        var currentInterval = Math.floor(currentScrollPosition/collectorInterval);
        if(currentInterval != lastCollectedInterval && initiated) {
            scrollHandler();
            lastCollectedInterval = currentInterval;
        }
    });
window.addEventListener('load', function() {
        document.head.appendChild(document.createElement('script')).text = '(' +
            function () {
                // injected DOM script is not a content script anymore,
                // it can modify objects and functions of the page
                var _pushState = history.pushState;
                history.pushState = function (state, title, url) {
                    _pushState.call(this, state, title, url);
                    window.dispatchEvent(new CustomEvent('state-changed', {
                        detail: state
                    }));
                };
                // repeat the above for replaceState too
            } + ')(); this.remove();'; // remove the DOM script element
        stateUpdated();
    });
