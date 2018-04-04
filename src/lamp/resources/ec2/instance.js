const fs = require('fs')
const index = fs.readFileSync(`${__dirname}/files/index.php`, 'utf-8')

module.exports = {
  "WebServerInstance": {  
    "Type": "AWS::EC2::Instance",
    "Metadata" : {
      "AWS::CloudFormation::Init" : {
        "configSets" : {
          "InstallAndRun" : [ "Install", "Configure" ]
        },

        "Install" : {
          "packages" : {
            "yum" : {
              "mysql"        : [],
              "mysql-server" : [],
              "mysql-libs"   : [],
              "httpd"        : [],
              "php"          : [],
              "php-mysql"    : []
            }
          },

          "files" : {
            "/var/www/html/index.php" : {
              "content": {
                "Fn::Sub": index,
              },
              "mode"  : "000600",
              "owner" : "apache",
              "group" : "apache"
            },

            "/tmp/setup.mysql" : {
              "content" : { "Fn::Join" : ["", [
                "CREATE DATABASE ", { "Ref" : "DBName" }, ";\n",
                "GRANT ALL ON ", { "Ref" : "DBName" }, ".* TO '", { "Ref" : "DBUser" }, "'@localhost IDENTIFIED BY '", { "Ref" : "DBPassword" }, "';\n"
                ]]},
              "mode"  : "000400",
              "owner" : "root",
              "group" : "root"
            },
            "/etc/cfn/cfn-hup.conf" : {
              "content" : { "Fn::Join" : ["", [
                "[main]\n",
                "stack=", { "Ref" : "AWS::StackId" }, "\n",
                "region=", { "Ref" : "AWS::Region" }, "\n"
              ]]},
              "mode"    : "000400",
              "owner"   : "root",
              "group"   : "root"
            },

            "/etc/cfn/hooks.d/cfn-auto-reloader.conf" : {
              "content": { "Fn::Join" : ["", [
                "[cfn-auto-reloader-hook]\n",
                "triggers=post.update\n",
                "path=Resources.WebServerInstance.Metadata.AWS::CloudFormation::Init\n",
                "action=/opt/aws/bin/cfn-init -v ",
                "         --stack ", { "Ref" : "AWS::StackName" },
                "         --resource WebServerInstance ",
                "         --configsets InstallAndRun ",
                "         --region ", { "Ref" : "AWS::Region" }, "\n",
                "runas=root\n"
              ]]},
              "mode"    : "000400",
              "owner"   : "root",
              "group"   : "root"
            }
          },

          "services" : {
            "sysvinit" : {  
              "mysqld"  : { "enabled" : "true", "ensureRunning" : "true" },
              "httpd"   : { "enabled" : "true", "ensureRunning" : "true" },
              "cfn-hup" : { "enabled" : "true", "ensureRunning" : "true",
                            "files" : ["/etc/cfn/cfn-hup.conf", "/etc/cfn/hooks.d/cfn-auto-reloader.conf"]}
            }
          }
        },

        "Configure" : {
          "commands" : {
            "01_set_mysql_root_password" : {
              "command" : { "Fn::Join" : ["", ["mysqladmin -u root password '", { "Ref" : "DBRootPassword" }, "'"]]},
              "test" : { "Fn::Join" : ["", ["$(mysql ", { "Ref" : "DBName" }, " -u root --password='", { "Ref" : "DBRootPassword" }, "' >/dev/null 2>&1 </dev/null); (( $? != 0 ))"]]}
            },
            "02_create_database" : {
              "command" : { "Fn::Join" : ["", ["mysql -u root --password='", { "Ref" : "DBRootPassword" }, "' < /tmp/setup.mysql"]]},
              "test" : { "Fn::Join" : ["", ["$(mysql ", { "Ref" : "DBName" }, " -u root --password='", { "Ref" : "DBRootPassword" }, "' >/dev/null 2>&1 </dev/null); (( $? != 0 ))"]]}
            }
          }
        }
      }
    },
    "Properties": {
      "ImageId" : { "Fn::FindInMap" : [ "AWSRegionArch2AMI", { "Ref" : "AWS::Region" },
                        { "Fn::FindInMap" : [ "AWSInstanceType2Arch", { "Ref" : "InstanceType" }, "Arch" ] } ] },
      "InstanceType"   : { "Ref" : "InstanceType" },
      "SecurityGroups" : [ {"Ref" : "WebServerSecurityGroup"} ],
      "KeyName"        : { "Ref" : "KeyName" },
      "UserData"       : { "Fn::Base64" : { "Fn::Join" : ["", [
            "#!/bin/bash -xe\n",
            "yum update -y aws-cfn-bootstrap\n",

            "# Install the files and packages from the metadata\n",
            "/opt/aws/bin/cfn-init -v ",
            "         --stack ", { "Ref" : "AWS::StackName" },
            "         --resource WebServerInstance ",
            "         --configsets InstallAndRun ",
            "         --region ", { "Ref" : "AWS::Region" }, "\n",

            "# Signal the status from cfn-init\n",
            "/opt/aws/bin/cfn-signal -e $? ",
            "         --stack ", { "Ref" : "AWS::StackName" },
            "         --resource WebServerInstance ",
            "         --region ", { "Ref" : "AWS::Region" }, "\n"
      ]]}},
      "Tags": [
        {
          "Key": "Name",
          "Value": { "Ref": "ParamInstanceName" }
        },
        {
          "Key": "Developer",
          "Value": { "Ref": "ParamDeveloperName" }
        },
      ]
    },
    "CreationPolicy" : {
      "ResourceSignal" : {
        "Timeout" : "PT5M"
      }
    }
  }
}