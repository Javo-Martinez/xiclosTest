<?php


           
$servername = "localhost";
$username = "xiclosreadonly";
$password = "2019.xiclos";
$dbname = "xiclosnew";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} 

$sql = "SELECT `user_pass` FROM `456754redcx_users` WHERE `user_login` = 'javiermartinez'";
$result = $conn->query($sql);


if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
        
        $password ="tGfqG86@O^jZLvrL";
        
       $salt = "5YCPxdc~V~Xqhk@j$Ipr(WvO~&+aDIjeLc6 !_vT;ewX!h6*Ld$Hv;Uc8>vl@RU&";
//        $salt = "n-<$5yt<zimT^Q?@RB`sY6tw-MAJ6$#/P-J6%.,l}U=Y*i!P-^A4.i0{-Rf5qm`l";
//        $salt = " QoUZppn.|,bf|t<!w|fH?=0F.Qz(^~r/_BKn)dYtTa8$WZ..d9d CEA,Q0~^2c8";
//        $salt = "Xc+u8|NFZIcM8rObbcl6V9iEwv9Kmv>7|=k6_AN_c{[f*-{0wUJ{XIDfD:,0W#pg";
//        $salt = "T$|H}jIz*7#_!Efb/r({>x{fFh[*FT.kl J=#)Ahmh>M5M]bxO`M)znL$U6j& v=";
//$salt ="6ce4kc3=>`W6>QOR#ko2~$-n9PO{54E{e_B&,A?x_<Yz)Ev*oD:Ot)FVI;V!u`Aq";
//       $salt ="_R7(J0t1G}yJJLx1tzGaCP,X91aq2|=Y@;2{E^bv1A=5VJ$@X0LlHdWNpZ0D`.G[";

        
        
        echo "My pwd: ".$row["user_pass"];
        echo "<br />";
        
        $hash = md5($salt . $password);
        $hashed_password = crypt($hash);
        echo "1: ".$hash;
        echo "<br />";
        echo "2: ".$hashed_password;
        echo "<br />";
		$hash = md5($hash . $password);
        $hashed_password = crypt($hash);
        echo "3: ".$hash;
        echo "<br />";
        echo "4: ".$hashed_password;
        echo "<br />";



        $hash = md5($password,$salt);
        $hashed_password = crypt($hash);
        echo "5: ".$hash;
        echo "<br />";
        echo "6: ".$hashed_password;
        echo "<br />";
		$hash = md5($password,$salt);
        $hashed_password = crypt($hash);
        echo "7: ".$hash;
        echo "<br />";
        echo "8: ".$hashed_password;
        echo "<br />";
    
        //$hashed_password = crypt("tGfqG86@O^jZLvrL"); 
        
        if (hash_equals($hashed_password, crypt($row["user_pass"], $hashed_password))) {
           echo "In the Matrix" ;
        }
        else{
           echo "¡No pasarán!";
            
        }

    }
} else {
    echo "0 results";
}
$conn->close();
?>