$(function () {

    "use strict";

    var $form = $('#ajax-contact');
    if (!$form.length) {
        return;
    }

    var defaultSuccessMessage = 'Thank you! Your submission has been received.';

    var $q1OtherWrap = $('#q1-other-wrap');
    var $q1Other = $('#q1_other_specify');

    function syncQ1Other() {
        if (!$q1OtherWrap.length || !$q1Other.length) {
            return;
        }
        var v = $form.find('input[name="q1_best_describes"]:checked').val();
        if (v === 'other') {
            $q1OtherWrap.show();
            $q1Other.prop('required', true);
        } else {
            $q1OtherWrap.hide();
            $q1Other.prop('required', false).val('');
        }
    }

    function pickFirst(obj, keys) {
        var i;
        for (i = 0; i < keys.length; i++) {
            if (obj && obj[keys[i]] !== undefined && obj[keys[i]] !== null && obj[keys[i]] !== '') {
                return obj[keys[i]];
            }
        }
        return null;
    }

    function messageFromSuccessPayload(data) {
        if (!data || typeof data !== 'object') {
            return defaultSuccessMessage;
        }
        var nested = pickFirst(data, ['data', 'Data']);
        var msg = pickFirst(data, ['message', 'Message']);
        if (!msg && nested && typeof nested === 'object') {
            msg = pickFirst(nested, ['message', 'Message']);
        }
        return typeof msg === 'string' && msg.length ? msg : defaultSuccessMessage;
    }

    function messageFromErrorPayload(xhr) {
        var text = xhr.responseText || '';
        try {
            var j = JSON.parse(text);
            var err = pickFirst(j, ['message', 'Message', 'title', 'Title', 'detail', 'Detail']);
            if (typeof err === 'string' && err.length) {
                return err;
            }
            var errors = pickFirst(j, ['errors', 'Errors']);
            if (errors && typeof errors === 'object') {
                var parts = [];
                Object.keys(errors).forEach(function (k) {
                    var v = errors[k];
                    if (Array.isArray(v)) {
                        parts.push(k + ': ' + v.join(' '));
                    } else if (typeof v === 'string') {
                        parts.push(v);
                    }
                });
                if (parts.length) {
                    return parts.join(' ');
                }
            }
        } catch (ignore) {
        }
        if (xhr.status) {
            return 'Request failed (' + xhr.status + '). Please try again later.';
        }
        return 'There was an error while submitting the form. Please try again later.';
    }

    function showAlert(type, text) {
        var messageAlert = 'alert-' + type;
        var alertBox = '<div class="alert ' + messageAlert + ' alert-dismissible fade show" role="alert">' +
            '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
            '<span aria-hidden="true">&times;</span></button>' +
            '<span class="alert-message-text">' + text + '</span></div>';
        $form.find('.messages').html(alertBox);
    }

    $form.on('change', 'input[name="q1_best_describes"]', syncQ1Other);
    syncQ1Other();

    $form.validator();

    $form.on('submit', function (e) {

        if (e.isDefaultPrevented()) {
            return;
        }

        $form.find('.turnstile-error').text('');

        var $q2Inputs = $form.find('input[name="q2_primary_use[]"]');
        if ($q2Inputs.length) {
            var q2Count = $form.find('input[name="q2_primary_use[]"]:checked').length;
            if (q2Count < 1) {
                e.preventDefault();
                showAlert('danger', 'Please select at least one option for question 2.');
                return false;
            }
        }

        if (typeof turnstile !== 'undefined' && $form.find('#cf-turnstile-contact').length) {
            var contactWid = window.__cfTurnstileContact;
            var token = (contactWid !== undefined && contactWid !== null)
                ? turnstile.getResponse(contactWid)
                : turnstile.getResponse();
            if (!token) {
                e.preventDefault();
                $form.find('.turnstile-error').text('Please complete the captcha.');
                return false;
            }
        }

        var endpoint = $form.attr('data-api-endpoint');
        if (!endpoint) {
            e.preventDefault();
            showAlert('danger', 'Form is not configured (missing data-api-endpoint).');
            return false;
        }

        var $btn = $form.find('button[type="submit"]');
        $btn.prop('disabled', true);

        $.ajax({
            type: 'POST',
            url: endpoint,
            data: $form.serialize(),
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            dataType: 'json'
        }).done(function (data, textStatus, jqXHR) {
            var msg = messageFromSuccessPayload(data);
            showAlert('success', msg);
            $form[0].reset();
            syncQ1Other();
            if (typeof turnstile !== 'undefined') {
                if (window.__cfTurnstileContact !== undefined && window.__cfTurnstileContact !== null) {
                    turnstile.reset(window.__cfTurnstileContact);
                } else {
                    turnstile.reset();
                }
            }
        }).fail(function (jqXHR) {
            showAlert('danger', messageFromErrorPayload(jqXHR));
        }).always(function () {
            $btn.prop('disabled', false);
        });

        return false;
    });
});

$(function () {

    "use strict";

    var $trialForm = $('#ajax-trial-signup');
    if (!$trialForm.length) {
        return;
    }

    var defaultTrialSuccess = 'Thank you! Your free trial request has been received.';

    function pickFirst(obj, keys) {
        var i;
        for (i = 0; i < keys.length; i++) {
            if (obj && obj[keys[i]] !== undefined && obj[keys[i]] !== null && obj[keys[i]] !== '') {
                return obj[keys[i]];
            }
        }
        return null;
    }

    function messageFromSuccessPayload(data) {
        if (!data || typeof data !== 'object') {
            return defaultTrialSuccess;
        }
        var nested = pickFirst(data, ['data', 'Data']);
        var msg = pickFirst(data, ['message', 'Message']);
        if (!msg && nested && typeof nested === 'object') {
            msg = pickFirst(nested, ['message', 'Message']);
        }
        return typeof msg === 'string' && msg.length ? msg : defaultTrialSuccess;
    }

    function messageFromErrorPayload(xhr) {
        var text = xhr.responseText || '';
        try {
            var j = JSON.parse(text);
            var err = pickFirst(j, ['message', 'Message', 'title', 'Title', 'detail', 'Detail']);
            if (typeof err === 'string' && err.length) {
                return err;
            }
        } catch (ignore) {
        }
        if (xhr.status) {
            return 'Request failed (' + xhr.status + '). Please try again later.';
        }
        return 'There was an error while submitting the form. Please try again later.';
    }

    function showTrialAlert(type, text) {
        var messageAlert = 'alert-' + type;
        var alertBox = '<div class="alert ' + messageAlert + ' alert-dismissible fade show" role="alert">' +
            '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
            '<span aria-hidden="true">&times;</span></button>' +
            '<span class="alert-message-text">' + text + '</span></div>';
        $trialForm.find('.messages').html(alertBox);
    }

    var $trialQ1OtherWrap = $('#trial-q1-other-wrap');
    var $trialQ1Other = $('#trial_q1_other_specify');

    function syncTrialQ1Other() {
        if (!$trialQ1OtherWrap.length || !$trialQ1Other.length) {
            return;
        }
        var v = $trialForm.find('input[name="q1_describes"]:checked').val();
        if (v === 'other') {
            $trialQ1OtherWrap.show();
            $trialQ1Other.prop('required', true);
        } else {
            $trialQ1OtherWrap.hide();
            $trialQ1Other.prop('required', false).val('');
        }
    }

    $trialForm.on('change', 'input[name="q1_describes"]', syncTrialQ1Other);
    syncTrialQ1Other();

    $trialForm.validator();

    $trialForm.on('submit', function (e) {

        if (e.isDefaultPrevented()) {
            return;
        }

        $trialForm.find('.turnstile-error').text('');

        var q2TrialCount = $trialForm.find('input[name="q2_indami_use[]"]:checked').length;
        if ($trialForm.find('input[name="q2_indami_use[]"]').length && q2TrialCount < 1) {
            e.preventDefault();
            showTrialAlert('danger', 'Please select at least one option for question 2.');
            return false;
        }

        if (typeof turnstile !== 'undefined' && $trialForm.find('#cf-turnstile-trial').length) {
            var trialWid = window.__cfTurnstileTrial;
            var token = (trialWid !== undefined && trialWid !== null)
                ? turnstile.getResponse(trialWid)
                : turnstile.getResponse();
            if (!token) {
                e.preventDefault();
                $trialForm.find('.turnstile-error').text('Please complete the captcha.');
                return false;
            }
        }

        var endpoint = $trialForm.attr('data-api-endpoint');
        if (!endpoint) {
            e.preventDefault();
            showTrialAlert('danger', 'Form is not configured (missing data-api-endpoint).');
            return false;
        }

        var $btn = $trialForm.find('button[type="submit"]');
        $btn.prop('disabled', true);

        $.ajax({
            type: 'POST',
            url: endpoint,
            data: $trialForm.serialize(),
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            dataType: 'json'
        }).done(function (data) {
            var msg = messageFromSuccessPayload(data);
            showTrialAlert('success', msg);
            $trialForm[0].reset();
            syncTrialQ1Other();
            if (typeof turnstile !== 'undefined') {
                if (window.__cfTurnstileTrial !== undefined && window.__cfTurnstileTrial !== null) {
                    turnstile.reset(window.__cfTurnstileTrial);
                } else if ($trialForm.find('#cf-turnstile-trial').length) {
                    turnstile.reset();
                }
            }
        }).fail(function (jqXHR) {
            showTrialAlert('danger', messageFromErrorPayload(jqXHR));
        }).always(function () {
            $btn.prop('disabled', false);
        });

        return false;
    });
});
