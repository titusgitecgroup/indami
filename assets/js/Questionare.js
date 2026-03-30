(function ($) {

    "use strict";

    // -------------------------------------------------------------------------
    // Shared helpers: JSON API responses (success + error bodies vary by backend)
    // -------------------------------------------------------------------------

    function pickFirst(obj, keys) {
        var i;
        for (i = 0; i < keys.length; i++) {
            if (obj && obj[keys[i]] !== undefined && obj[keys[i]] !== null && obj[keys[i]] !== '') {
                return obj[keys[i]];
            }
        }
        return null;
    }

    function messageFromSuccessPayload(defaultMessage, data) {
        if (!data || typeof data !== "object") {
            return defaultMessage;
        }
        var nested = pickFirst(data, ["data", "Data"]);
        var msg = pickFirst(data, ["message", "Message"]);
        if (!msg && nested && typeof nested === "object") {
            msg = pickFirst(nested, ["message", "Message"]);
        }
        return typeof msg === "string" && msg.length ? msg : defaultMessage;
    }

    function formatErrorsObject(errors) {
        var parts = [];
        Object.keys(errors).forEach(function (k) {
            var v = errors[k];
            if (Array.isArray(v)) {
                parts.push(k + ": " + v.join(" "));
            } else if (typeof v === "string") {
                parts.push(v);
            }
        });
        return parts.length ? parts.join(" ") : "";
    }

    /**
     * Parses JSON error responses; optional `errors` map (ASP.NET-style) when parseErrorsObject is true.
     */
    function messageFromErrorPayload(xhr, parseErrorsObject) {
        var text = xhr.responseText || "";
        try {
            var j = JSON.parse(text);
            var err = pickFirst(j, ["message", "Message", "title", "Title", "detail", "Detail"]);
            if (typeof err === "string" && err.length) {
                return err;
            }
            if (parseErrorsObject) {
                var errors = pickFirst(j, ["errors", "Errors"]);
                if (errors && typeof errors === "object") {
                    var combined = formatErrorsObject(errors);
                    if (combined) {
                        return combined;
                    }
                }
            }
        } catch (ignore) {
        }
        if (xhr.status) {
            return "Request failed (" + xhr.status + "). Please try again later.";
        }
        return "There was an error while submitting the form. Please try again later.";
    }

    // -------------------------------------------------------------------------
    // Bootstrap alert inside a form's .messages container
    // -------------------------------------------------------------------------

    function showFormAlert($form, type, text) {
        var messageAlert = "alert-" + type;
        var alertBox =
            '<div class="alert ' + messageAlert + ' alert-dismissible fade show" role="alert">' +
            '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
            '<span aria-hidden="true">&times;</span></button>' +
            '<span class="alert-message-text">' + text + "</span></div>";
        $form.find(".messages").html(alertBox);
    }

    // -------------------------------------------------------------------------
    // Cloudflare Turnstile (widget id stored on window by inline callback)
    // -------------------------------------------------------------------------

    function getTurnstileToken(widgetId) {
        if (typeof turnstile === "undefined") {
            return null;
        }
        if (widgetId !== undefined && widgetId !== null) {
            return turnstile.getResponse(widgetId);
        }
        return turnstile.getResponse();
    }

    /** Contact form: reset by widget id, or global reset (matches original behavior). */
    function resetTurnstileContact() {
        if (typeof turnstile === "undefined") {
            return;
        }
        if (window.__cfTurnstileContact !== undefined && window.__cfTurnstileContact !== null) {
            turnstile.reset(window.__cfTurnstileContact);
        } else {
            turnstile.reset();
        }
    }

    /** Trial form: reset by widget id, or global reset only if the widget node is present. */
    function resetTurnstileTrial($form) {
        if (typeof turnstile === "undefined") {
            return;
        }
        if (window.__cfTurnstileTrial !== undefined && window.__cfTurnstileTrial !== null) {
            turnstile.reset(window.__cfTurnstileTrial);
        } else if ($form.find("#cf-turnstile-trial").length) {
            turnstile.reset();
        }
    }

    // -------------------------------------------------------------------------
    // Q1: show/hide "other" text field when radio "other" is selected
    // -------------------------------------------------------------------------

    function createQ1OtherSync($form, $wrap, $other, radioName) {
        return function syncQ1Other() {
            if (!$wrap.length || !$other.length) {
                return;
            }
            var v = $form.find('input[name="' + radioName + '"]:checked').val();
            if (v === "other") {
                $wrap.show();
                $other.prop("required", true);
            } else {
                $wrap.hide();
                $other.prop("required", false).val("");
            }
        };
    }

    // -------------------------------------------------------------------------
    // Early access / contact form (#ajax-contact)
    // -------------------------------------------------------------------------

    function initAjaxContact() {
        var $form = $("#ajax-contact");
        if (!$form.length) {
            return;
        }

        var defaultSuccessMessage = "Thank you! Your submission has been received.";
        var $q1OtherWrap = $("#q1-other-wrap");
        var $q1Other = $("#q1_other_specify");
        var syncQ1Other = createQ1OtherSync($form, $q1OtherWrap, $q1Other, "q1_best_describes");

        $form.on("change", 'input[name="q1_best_describes"]', syncQ1Other);
        syncQ1Other();

        $form.validator();

        $form.on("submit", function (e) {
            if (e.isDefaultPrevented()) {
                return;
            }

            $form.find(".turnstile-error").text("");

            var $q2Inputs = $form.find('input[name="q2_primary_use[]"]');
            if ($q2Inputs.length) {
                var q2Count = $form.find('input[name="q2_primary_use[]"]:checked').length;
                if (q2Count < 1) {
                    e.preventDefault();
                    showFormAlert($form, "danger", "Please select at least one option for question 2.");
                    return false;
                }
            }

            if (typeof turnstile !== "undefined" && $form.find("#cf-turnstile-contact").length) {
                var token = getTurnstileToken(window.__cfTurnstileContact);
                if (!token) {
                    e.preventDefault();
                    $form.find(".turnstile-error").text("Please complete the captcha.");
                    return false;
                }
            }

            var endpoint = $form.attr("data-api-endpoint");
            if (!endpoint) {
                e.preventDefault();
                showFormAlert($form, "danger", "Form is not configured (missing data-api-endpoint).");
                return false;
            }

            var $btn = $form.find('button[type="submit"]');
            $btn.prop("disabled", true);

            $.ajax({
                type: "POST",
                url: endpoint,
                data: $form.serialize(),
                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                dataType: "json"
            })
                .done(function (data) {
                    var msg = messageFromSuccessPayload(defaultSuccessMessage, data);
                    showFormAlert($form, "success", msg);
                    $form[0].reset();
                    syncQ1Other();
                    resetTurnstileContact();
                })
                .fail(function (jqXHR) {
                    showFormAlert($form, "danger", messageFromErrorPayload(jqXHR, true));
                })
                .always(function () {
                    $btn.prop("disabled", false);
                });

            return false;
        });
    }

    // -------------------------------------------------------------------------
    // Free trial signup (#ajax-trial-signup)
    // -------------------------------------------------------------------------

    function initAjaxTrialSignup() {
        var $form = $("#ajax-trial-signup");
        if (!$form.length) {
            return;
        }

        var defaultSuccessMessage = "Thank you! Your free trial request has been received.";
        var $q1OtherWrap = $("#trial-q1-other-wrap");
        var $q1Other = $("#trial_q1_other_specify");
        var syncQ1Other = createQ1OtherSync($form, $q1OtherWrap, $q1Other, "q1_describes");

        $form.on("change", 'input[name="q1_describes"]', syncQ1Other);
        syncQ1Other();

        $form.validator();

        $form.on("submit", function (e) {
            if (e.isDefaultPrevented()) {
                return;
            }

            $form.find(".turnstile-error").text("");

            var hasQ2 = $form.find('input[name="q2_indami_use[]"]').length;
            var q2Count = $form.find('input[name="q2_indami_use[]"]:checked').length;
            if (hasQ2 && q2Count < 1) {
                e.preventDefault();
                showFormAlert($form, "danger", "Please select at least one option for question 2.");
                return false;
            }

            if (typeof turnstile !== "undefined" && $form.find("#cf-turnstile-trial").length) {
                var token = getTurnstileToken(window.__cfTurnstileTrial);
                if (!token) {
                    e.preventDefault();
                    $form.find(".turnstile-error").text("Please complete the captcha.");
                    return false;
                }
            }

            var endpoint = $form.attr("data-api-endpoint");
            if (!endpoint) {
                e.preventDefault();
                showFormAlert($form, "danger", "Form is not configured (missing data-api-endpoint).");
                return false;
            }

            var $btn = $form.find('button[type="submit"]');
            $btn.prop("disabled", true);

            $.ajax({
                type: "POST",
                url: endpoint,
                data: $form.serialize(),
                contentType: "application/x-www-form-urlencoded; charset=UTF-8",
                dataType: "json"
            })
                .done(function (data) {
                    var msg = messageFromSuccessPayload(defaultSuccessMessage, data);
                    showFormAlert($form, "success", msg);
                    $form[0].reset();
                    syncQ1Other();
                    resetTurnstileTrial($form);
                })
                .fail(function (jqXHR) {
                    showFormAlert($form, "danger", messageFromErrorPayload(jqXHR, true));
                })
                .always(function () {
                    $btn.prop("disabled", false);
                });

            return false;
        });
    }

    $(function () {
        initAjaxContact();
        initAjaxTrialSignup();
    });

})(jQuery);
