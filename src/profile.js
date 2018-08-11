import $ from 'jquery';
window.$ = $;
import 'bootstrap/dist/js/bootstrap.bundle.js';
import 'bootstrap/dist/css/bootstrap.css';
import '@fortawesome/fontawesome-free/js/all.js';
$('*[name=1]').change(function(event) {
  // console.log(this.value);
  if(this.value == 'เคย') {
    $('*[name=2]').prop('disabled', false);
  }
  else if(this.value == 'ไม่เคย') {
    $('*[name=2]').prop('disabled', true).val('');
  }
}).change();
$('*[name=3]').change(function(event) {
  if($(this).prop('checked')) $('*[name=4]').prop('disabled', false);
  else $('*[name=4]').prop('disabled', true).val('');
}).change();
$('*[name=36]').change(function(event) {
  if($(this).prop('checked')) $('*[name=37], *[name=38], *[name=39]').prop('disabled', false);
  else $('*[name=37], *[name=38], *[name=39]').prop('disabled', true).val('');
}).change();
$('*[name=43]').change(function(event) {
  if($(this).prop('checked')) $('*[name=44]').prop('disabled', false);
  else $('*[name=44]').prop('disabled', true).val('');
}).change();
$('*[name=45]').change(function(event) {
  if($(this).prop('checked')) $('*[name=46]').prop('disabled', false);
  else $('*[name=46]').prop('disabled', true).val('');
}).change();
$('*[name=47]').change(function(event) {
  if($(this).prop('checked')) $('*[name=48]').prop('disabled', false);
  else $('*[name=48]').prop('disabled', true).val('');
}).change();
$('*[name=49]').change(function(event) {
  if($(this).prop('checked')) $('*[name=50]').prop('disabled', false);
  else $('*[name=50]').prop('disabled', true).val('');
}).change();
$('*[name=52]').change(function(event) {
  if($(this).prop('checked')) $('*[name=53]').prop('disabled', false);
  else $('*[name=53]').prop('disabled', true).val('');
}).change();
$('*[name=55]').change(function(event) {
  if($(this).prop('checked')) $('*[name=56]').prop('disabled', false);
  else $('*[name=56]').prop('disabled', true).val('');
}).change();
