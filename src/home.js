import $ from 'jquery';
window.$ = $;
import 'bootstrap/dist/js/bootstrap.bundle.js';
import 'bootstrap/dist/css/bootstrap.css';
import Swal from 'sweetalert2';
import '@fortawesome/fontawesome-free/js/solid.js';
import '@fortawesome/fontawesome-free/js/fontawesome.js';
window.Swal = Swal;

$(() => {
  (function($) {
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

    $.fn.attrchange = function(callback) {
      if (MutationObserver) {
        var options = {
          subtree: false,
          attributes: true
        };

        var observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(e) {
            callback.call(e.target, e.attributeName);
          });
        });

        return this.each(function() {
          observer.observe(this, options);
        });
      }
    }
  })($); // https://stackoverflow.com/a/24284069/4468834

  // Every time a modal is shown, if it has an autofocus element, focus on it.
  $('.modal').on('shown.bs.modal', function () {
    $(this).find('[autofocus]').focus();
  });

  $('.features-tabs a').attrchange(function (attrName) {
    if (attrName != 'class') return ;
    if ($(this).hasClass('is-active')) {
      $($(this).attr('nav-bind')).addClass('active');
      // $('#dropdown').addClass('active');
    }
    else {
      $($(this).attr('nav-bind')).removeClass('active');
      // $('#dropdown').removeClass('active');
    }
  });
});