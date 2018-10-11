import $ from 'jquery';
window.$ = $;
import 'bootstrap/dist/js/bootstrap.bundle.js';
import 'bootstrap/dist/css/bootstrap.css';
import '@fortawesome/fontawesome-free/js/solid.js';
import '@fortawesome/fontawesome-free/js/fontawesome.js';
import Swal from 'sweetalert2';
window.Swal = Swal;

window.onload = () => {
  let $alert = $('#alert');
  if($alert.length) {
    Swal($alert.attr('alert-type'), $alert.text(), $alert.attr('alert-type'));
  }
}