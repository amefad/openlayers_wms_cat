<?php
header("Content-type:application/javascript");
$function = $_GET['callback'];
echo $function;
echo '(
{"type":"FeatureCollection",
	"features":[
	{"type":"Feature",
		"bbox":[12.31000,45.8901,12.31806,45.8985],
		"geometry":{"type":"Point","coordinates":[12.3140362072269,45.89241345],},
		"properties":{"search_full":"C957_003500","search_short":"C957_003500", "comune":"C957 - Conegliano (TV)", "foglio":"003500", "mappale":""}
		},
		{"type":"Feature",
		"geometry":{"type":"Point","coordinates":[12.3140362072269,45.89241345]},
		"properties":{"search_full":"C957_003500.191","search_short":"C957_003500.191", "comune":"C957 - Conegliano (TV)", "foglio":"003500", "mappale":"191"}
		},
	]
	});';
?>
	