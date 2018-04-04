<html>
  <head>
    <title>AWS CloudFormation PHP Sample</title>
    <meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
</head>
<body>
  <h1>Welcome to the AWS CloudFormation PHP Sample</h1>
  <br />
  <?php
    // Print out the current data and time
    print "The Current Date and Time is: <br/>";
    print date("g:i A l, F j Y.");
  ?>
  <br />
  <?php
    // Setup a handle for CURL
    $curl_handle=curl_init();
    curl_setopt($curl_handle,CURLOPT_CONNECTTIMEOUT,2);
    curl_setopt($curl_handle,CURLOPT_RETURNTRANSFER,1);

    // Get the hostname of the intance from the instance metadata
    curl_setopt($curl_handle,CURLOPT_URL,'http://169.254.169.254/latest/meta-data/public-hostname');
    $hostname = curl_exec($curl_handle);

    if (empty($hostname)) {
      print "Sorry, for some reason, we got no hostname back <br />";
    } else {
      print "Server = " . $hostname . "<br />";
    }

    // Get the instance-id of the intance from the instance metadata
    curl_setopt($curl_handle,CURLOPT_URL,'http://169.254.169.254/latest/meta-data/instance-id');
    $instanceid = curl_exec($curl_handle);

    if (empty($instanceid)) {
      print "Sorry, for some reason, we got no instance id back <br />";
    } else {
      print "EC2 instance-id = " . $instanceid . "<br />";
    }

    $Database   = "localhost";
    $DBUser     = "${DBUser}";
    $DBPassword = "${DBPassword}";
    
    print "Database = " . $Database . "<br />" . $DBUser . " + " . $DBPassword . "<br />";
    
    $dbconnection = mysql_connect($Database, $DBUser, $DBPassword)
                    or die("Could not connect: " . mysql_error());
    print ("Connected to $Database successfully");
    mysql_close($dbconnection);
  ?>
  <h2>PHP Information</h2>
  <br />
  <?php
    phpinfo();
  ?>
  </body>
</html>