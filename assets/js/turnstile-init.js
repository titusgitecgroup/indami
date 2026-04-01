(function () {
    'use strict';

    var SITEKEY =
        (typeof window !== "undefined" &&
            window.__CONFIG__ &&
            window.__CONFIG__.turnstileSiteKey);

    function renderWidgets() {
        if (typeof turnstile === 'undefined') {
            return false;
        }
        var trial = document.getElementById('cf-turnstile-trial');
        var contact = document.getElementById('cf-turnstile-contact');
        if (trial && !trial.getAttribute('data-cf-rendered')) {
            window.__cfTurnstileTrial = turnstile.render('#cf-turnstile-trial', { sitekey: SITEKEY });
            trial.setAttribute('data-cf-rendered', '1');
        }
        if (contact && !contact.getAttribute('data-cf-rendered')) {
            window.__cfTurnstileContact = turnstile.render('#cf-turnstile-contact', { sitekey: SITEKEY });
            contact.setAttribute('data-cf-rendered', '1');
        }
        return true;
    }

    function poll() {
        if (renderWidgets()) {
            return;
        }
        setTimeout(poll, 50);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', poll);
    } else {
        poll();
    }
}());
