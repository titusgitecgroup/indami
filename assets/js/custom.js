(function ($) {
    "use strict";

    $(document).ready(function () {

        /*---------------------------------------------------
            testimonial
        ----------------------------------------------------*/
        $('.client-single').on('click', function (event) {
            event.preventDefault();

            var active = $(this).hasClass('active');

            var parent = $(this).parents('.testi-wrap');

            if (!active) {
                var activeBlock = parent.find('.client-single.active');

                var currentPos = $(this).attr('data-position');

                var newPos = activeBlock.attr('data-position');

                activeBlock.removeClass('active').removeClass(newPos).addClass('inactive').addClass(currentPos);
                activeBlock.attr('data-position', currentPos);

                $(this).addClass('active').removeClass('inactive').removeClass(currentPos).addClass(newPos);
                $(this).attr('data-position', newPos);

            }
        });

        /*---------------------------------------------------
            pricing table
        ----------------------------------------------------*/
        var monthly_price_table = $('#pricing-wrap').find('.monthly');
        var yearly_price_table = $('#pricing-wrap').find('.yearly');

        $('.switch-toggles').find('.monthly').addClass('active');
        $('#pricing-wrap').find('.monthly').addClass('active');

        $('.switch-toggles').find('.monthly').on('click', function () {
            $(this).addClass('active');
            $(this).closest('.switch-toggles').removeClass('active');
            $(this).siblings().removeClass('active');
            monthly_price_table.addClass('active');
            yearly_price_table.removeClass('active');
        });

        $('.switch-toggles').find('.yearly').on('click', function () {
            $(this).addClass('active');
            $(this).closest('.switch-toggles').addClass('active');
            $(this).siblings().removeClass('active');
            yearly_price_table.addClass('active');
            monthly_price_table.removeClass('active');
        });

        /*---------------------------------------------------
            awesome feature carousel
        ----------------------------------------------------*/
        function a(e) {
            $featureLinks.removeClass("active"), e.addClass("active")
        }
        var $owlFeatures = $(".awesome-feat-carousel"),
            $featureLinks = $(".feature-link");
        $owlFeatures.owlCarousel({
            loop: !0,
            responsiveClass: !0,
            margin: 30,
            nav: true,
            dots: !1,
            navText: ['<i class="icon-left-arrow"></i>', '<i class="icon-arrow-pointing-to-right"></i>'],
            responsive: {
                0: {
                    items: 1
                },
                768: {
                    items: 1
                },
                991: {
                    items: 2
                },
                1200: {
                    items: 2
                },
                1920: {
                    items: 3
                }
            }
        }),
            $owlFeatures.on("initialized.owl.carousel refreshed.owl.carousel resized.owl.carousel changed.owl.carousel", function () {
                if ($(window).width() < 1920) return;
                $owlFeatures.find(".owl-nav, .owl-nav .owl-prev, .owl-nav .owl-next").removeClass("disabled");
            }),
            $owlFeatures.on("changed.owl.carousel", function (e) {
                var o = e.item.index + 1 - e.relatedTarget._clones.length / 2,
                    n = e.item.count;
                (o > n || 0 == o) && (o = n - o % n), o--;
                var t = $(".feature-link:nth(" + o + ")");
                a(t)
            }),
            $featureLinks.on("click", function () {
                var e = $(this).data("owl-item");
                $owlFeatures.trigger("to.owl.carousel", e), a($(this))
            });

        /*---------------------------------------------------
            screen carousel
        ----------------------------------------------------*/
        $('.screen-carousel').owlCarousel({
            loop: true,
            navText: ['<i class="icon-left-arrow"></i>', '<i class="icon-arrow-pointing-to-right"></i>'],
            nav: true,
            autoplay: true,
            dots: false,
            autoplayTimeout: 5000,
            animateOut: 'fadeOut',
            animateIn: 'fadeIn',
            smartSpeed: 450,
            margin: 30,
            responsive: {
                0: {
                    items: 1
                },
                768: {
                    items: 3
                },
                991: {
                    items: 3
                },
                1200: {
                    items: 3
                },
                1920: {
                    items: 4
                }
            }
        });

        /*---------------------------------------------------
            counter
        ----------------------------------------------------*/
        $('.counter-single h2').counterUp({
            delay: 10, // the delay time in ms
            time: 1000 // the speed time in ms
        });

        /*---------------------------------------------------
                magnific popUp
        ----------------------------------------------------*/

        $('.popup-video').magnificPopup({
            disableOn: 700,
            type: 'iframe',
            mainClass: 'mfp-fade',
            removalDelay: 160,
            preloader: false,
            fixedContentPos: false,
            disableOn: 300
        });

        /*---------------------------------------------------
            section scroll (scrollIt with header offset)
        ----------------------------------------------------*/
        function getHeaderScrollOffset() {
            var $header = $('#header');
            var wasSticky = $header.hasClass('sticky');

            $header.addClass('sticky');
            var height = $header.outerHeight() || 100;
            if (!wasSticky) {
                $header.removeClass('sticky');
            }

            return -height;
        }

        function scrollToSection(index) {
            var $target = $('[data-scroll-index="' + index + '"]');
            if (!$target.length) {
                return;
            }

            var top = $target.offset().top + getHeaderScrollOffset() + 1;
            $('html, body').animate({ scrollTop: Math.max(0, top) }, 600);
        }

        function updateActiveSectionNav() {
            var scrollTop = getScrollTop();
            var offset = getHeaderScrollOffset();
            var $activeSection = $('[data-scroll-index]').filter(function () {
                var $section = $(this);
                var sectionTop = $section.offset().top + offset;
                return scrollTop >= sectionTop && scrollTop < sectionTop + $section.outerHeight();
            });
            var index = $activeSection.first().attr('data-scroll-index');

            if (index === undefined) {
                return;
            }

            $('[data-scroll-nav]').removeClass('active');
            $('[data-scroll-nav="' + index + '"]').addClass('active');
        }

        $('body').on('click', '[data-scroll-nav], [data-scroll-goto]', function (e) {
            e.preventDefault();
            var index = $(this).closest('[data-scroll-nav]').attr('data-scroll-nav') || $(this).attr('data-scroll-goto');
            scrollToSection(parseInt(index, 10));
        });

        $(window).on('scroll', updateActiveSectionNav);
        $(window).on('resize', updateActiveSectionNav);
        updateActiveSectionNav();

    });

    /*---------------------------------------------------
        sticky header
    ----------------------------------------------------*/
    function getScrollTop() {
        return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    }

    var isHeaderSticky = false;

    function updateStickyHeader() {
        var scrollTop = getScrollTop();

        if (!isHeaderSticky && scrollTop >= 100) {
            isHeaderSticky = true;
            $("#header").addClass("sticky");
        } else if (isHeaderSticky && scrollTop < 50) {
            isHeaderSticky = false;
            $("#header").removeClass("sticky");
        }
    }

    $(window).on('scroll', updateStickyHeader);
    $(window).on('load', updateStickyHeader);
    updateStickyHeader();

    /*---------------------------------------------------
        accordian
    ----------------------------------------------------*/
    $('#faq-area .collapse').on('show.bs.collapse', function () {
        $(this).prev().addClass('active');
    });

    $('#faq-area .collapse').on('hide.bs.collapse', function () {
        $(this).prev().removeClass('active');
    });

    /*---------------------------------------------------
        preloader
    ----------------------------------------------------*/
    $(window).on('load', function () {
        $('.preloader').fadeOut(500);
    });


}(jQuery));
