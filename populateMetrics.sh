#!/bin/bash

host=http://localhost:3000

while true
do
  curl -s $host/api/order/menu;
  sleep 3;
done;
