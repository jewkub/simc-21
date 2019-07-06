import $ from 'jquery';
window.$ = $;
import 'bootstrap/dist/js/bootstrap.bundle.js';
import 'bootstrap/dist/css/bootstrap.css';
import Swal from 'sweetalert2';
import '@fortawesome/fontawesome-free/js/solid.js';
import '@fortawesome/fontawesome-free/js/fontawesome.js';
window.Swal = Swal;

$('.parallax').each(function(i) {
  $(this).css('--ratio', window.devicePixelRatio + '');
});
$(() => {
  // Every time a modal is shown, if it has an autofocus element, focus on it.
  $('.modal').on('shown.bs.modal', function() {
    $(this).find('[autofocus]').focus();
  });

  let $alert = $('#alert');
  if($alert.length) {
    // Swal($alert.attr('alert-type'), $alert.text(), $alert.attr('alert-type'));
  }
});