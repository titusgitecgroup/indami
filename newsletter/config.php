<?php

	// Put your MailChimp API and List ID hehe
	$api_key = 'fdd0ac155fa51ee394c1840ed6d0a2fc-us17';
	$list_id = 'f1d8533d37';

	// Let's start by including the MailChimp API wrapper
	include('./inc/MailChimp.php');
	// Then call/use the class
	use \DrewM\MailChimp\MailChimp;
	$MailChimp = new MailChimp($api_key);
	$result = $MailChimp->post("lists/$list_id/members", [
            'email_address' => $_POST["mc-email"],
            'status'        => 'subscribed',
        ]);

	if ($MailChimp->success()) {
		// Success message
		echo "Thanks for subscribe.";
	} else {
		// Display error
		echo "Already subscribed Or something error.";
	}
?>
