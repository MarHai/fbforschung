import ext from "./utils/ext";

var lastScrollPosition = -1,
    scrollInterval = 100,
    limitToHostname = 'facebook.com',
    rects = {},
    initiated = false;

/**
 * Called upon opening a website in order to change the icon
 */
function updateState() {
    var opened = document.location.hostname.indexOf(limitToHostname) >= 0;
    console.log('updateState with facebookopen ' + opened);
    ext.runtime.sendMessage({
            action: 'updateIcon',
            facebookopen: opened
        });
    if(opened) {
        ext.runtime.sendMessage({action: 'opened-facebook'},
            function () {
                initiated = true;
                scrollHandler();
            });
    }
}

/**
 * Called upon scrolling
 */
function scrollHandler() {
    if(!initiated) {
        return;
    }

    var top = document.body.getBoundingClientRect().top;
    if(top < 0) {
        top = top *(-1);
    }
    if(top > (lastScrollPosition + scrollInterval)) {
        lastScrollPosition = top;
    } else {
        return;
    }

    //collect all elements' top positions (if an element has an ID)
    document.querySelectorAll('[id]').forEach(function(domElem) {
        if (typeof(rects[domElem.id]) == 'undefined') {
            rects[domElem.id] = domElem.getBoundingClientRect();
        }
    });
    rects['body'] = document.body.getBoundingClientRect();

    ext.runtime.sendMessage({
            action: 'process-feed',
            data: document.body.innerHTML,
            rect: JSON.stringify(rects),
            scrolledUntil: lastScrollPosition
        }, function() {
            //after the feed has been processed, background.js is able to send interaction selectors
            ext.runtime.sendMessage({action: 'getInteractionSelectors'},
                function(interactionSelectors) {
                    var i, interactionElements, j, postElem;
                    for(i = 0; i < interactionSelectors.length; i++) {
                        interactionElements = document.querySelectorAll(interactionSelectors[i].totalCss);
                        for(j = 0; j < interactionElements.length; j++) {
                            postElem = interactionElements[j];
                            while((postElem = postElem.parentElement)) {
                                if(postElem.matches(interactionSelectors[i].postCss)) {
                                    if(!interactionElements[j].hasAttribute('data-postid')) {
                                        interactionElements[j].setAttribute('data-postid', postElem.id);
                                        interactionElements[j].setAttribute(
                                            'data-configcolumn',
                                            interactionSelectors[i].configColumn
                                        );
                                        interactionElements[j].setAttribute(
                                            'data-attr',
                                            interactionSelectors[i].attribute
                                        );
                                        interactionElements[j].addEventListener(
                                            interactionSelectors[i].event,
                                            function(event) {
                                                ext.runtime.sendMessage({
                                                    'action': 'interaction',
                                                    'id': event.target.attributes['data-postid'].value,
                                                    'column': event.target.attributes['data-configcolumn'].value,
                                                    'attribute': getAttribute(
                                                        event.target.attributes['data-attr'].value,
                                                        event.target
                                                    )
                                                });
                                            }
                                        );
                                    }
                                    break;
                                }
                            }
                        }
                    }
                });
        });
}

/**
 * Retrieve a certain attribute of a DOM element, handling attr-/data-/static- syntax
 * @param attribute the attribute to retrieve
 * @param domNode the DOM element
 * @returns {*}
 */
function getAttribute(attribute, domNode) {
    if(attribute.startsWith('attr-')) {
        return domNode.getAttribute(attribute.substr(5, attribute.length-5));
    } else {
        if(attribute.startsWith('data-')) {
            return domNode.dataset[attribute.substr(5, attribute.length-5)];
        } else {
            if(attribute.startsWith('static-')) {
                return domNode.dataset[attribute.substr(7, attribute.length-7)];
            } else {
                switch(attribute) {
                    case 'text':
                        return domNode.innerText;
                    case 'html':
                        return domNode.innerHTML;
                    case 'exists':
                        return true;
                    default:
                        return null;
                }
            }
        }
    }
}

/**
 * Listen to the scrolling event
 */
window.addEventListener('scroll', scrollHandler);

/**
 * Listen to website opening/closing events
 */
window.addEventListener('load', updateState);
window.addEventListener('beforeunload', updateState);
