import $ from 'jquery';
window.$ = $;
import 'bootstrap/dist/js/bootstrap.bundle.js';
import 'bootstrap/dist/css/bootstrap.css';
import '@fortawesome/fontawesome-free/js/solid.js';
import '@fortawesome/fontawesome-free/js/fontawesome.js';
const $emailInput = $('#emailInput');
const $form = $('form');
// const $formSubmit = $('#formSubmit');
const $emailInvalid = $('#emailInvalid');
const $passwordInput = $('#passwordInput');
const $passwordConfirmInput = $('#passwordConfirmInput');
[$emailInput, $passwordConfirmInput, $passwordInput].forEach(e => {
  e.focus(event => {
    e.removeClass('is-valid');
    e.removeClass('is-invalid');
  });
});
$emailInput.on('focusout', event => {
  if($emailInput[0].checkValidity() === true) {
    $.get('/register/validemail', {email: $emailInput.val()}, data => {
      // console.log(data.alreadyUsed);
      if($emailInput.hasClass('is-valid') || $emailInput.hasClass('is-invalid')) return ;
      if(data.error) {
        $emailInput.addClass('is-invalid');
        $emailInvalid.html('Some error!');
      }
      else if(data.alreadyUsed) {
        $emailInput.addClass('is-invalid');
        $emailInvalid.html('อีเมลนี้ถูกใช้ไปแล้ว');
      }
      else {
        $emailInput.addClass('is-valid');
      }
    });
  }
  else {
    $emailInput.addClass('is-invalid');
    $emailInvalid.html('อีเมลไม่ถูกต้อง');
  }
});
$passwordInput.on('focus', event => {
  if($passwordConfirmInput.hasClass('is-valid') || $passwordConfirmInput.hasClass('is-invalid')) {
    $passwordConfirmInput.removeClass('is-valid');
    $passwordConfirmInput.removeClass('is-invalid');
    $passwordConfirmInput.addClass('is-validating');
  }
});
$passwordInput.on('focusout', event => {
  if($passwordConfirmInput.hasClass('is-validating')) {
    $passwordConfirmInput.trigger('focusout');
  }
  if($passwordInput.val().length < 4) $passwordInput.addClass('is-invalid');
  else $passwordInput.addClass('is-valid');
});
$passwordConfirmInput.on('focusout', event => {
  if($passwordInput.val() != $passwordConfirmInput.val()) $passwordConfirmInput.addClass('is-invalid');
  else $passwordConfirmInput.addClass('is-valid');
});
$form.on('submit', function(event) {
  if ($('form input:not(.is-valid)').length > 0) {
    event.preventDefault();
    event.stopPropagation();
    $('form input:not(.is-valid)').each(function(i) {
      $(this).trigger('focusout');
    });
  }
  else $('input[type=submit]', this).attr('disabled', 'disabled');
});