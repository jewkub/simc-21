import $ from 'jquery';
window.$ = $;
import 'bootstrap/dist/js/bootstrap.bundle.js';
import 'bootstrap/dist/css/bootstrap.css';
import swal from 'sweetalert';
window.swal = swal;

let $alert = $('#alert');
if($alert.length) {
  swal($alert.attr('alert-type'), $alert.text(), $alert.attr('alert-type'));
}