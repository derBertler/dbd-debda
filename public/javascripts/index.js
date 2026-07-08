$(function () {
	$('#modal-patchnotes-010').on('shown.bs.modal', function () {
		$('#modal-patchnotes-010-button').focus();
	});
	const params = new URLSearchParams(window.location.search);
	if (params.get('showLogin') === 'true') {
		const loginModal = new bootstrap.Modal(document.getElementById('modal-login-signup'));
		loginModal.show();

		params.delete('showLogin');
		const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
		window.history.replaceState({}, '', newUrl);
		showErrorToast('Please log in to access that feature.');
	}
});