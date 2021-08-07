#!/bin/bash
uname -a # 顯示機器資訊
yum update -y # 更新 yum
amazon-linux-extras install -y lamp-mariadb10.2-php7.2 php7.2 # 使用amazon-linux-extras 安裝LAMP MariaDB與 PHP 套件
yum install -y httpd mariadb-server # 使用 yum 安裝Apache Web 伺服器與MariaDB
systemctl start httpd # 啟動Apache Web 伺服器
systemctl enable httpd # 設定開機啟動Apache Web 伺服器
usermod -a -G apache ec2-user # 將使用者 ec2-user 加入 apache 群組
chown -R ec2-user:apache /var/www # 修改 /var/www 所有權與變更群組至 apache
chmod 2775 /var/www # 變更 /var/www 目錄權限
find /var/www -type d -exec chmod 2775 {} \; # 變更 /var/www 字目錄權限
find /var/www -type f -exec chmod 0664 {} \; # 新增群組寫入權限
echo "<?php phpinfo(); ?>" > /var/www/html/phpinfo.php # 新增 phpinfo 測試檔案
