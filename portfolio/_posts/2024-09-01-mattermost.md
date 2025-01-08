---
layout: post
title:  "On Premise Mattermost"
thumb: "/assets/portfolio/mattermost/thumb.png"
tags: 
---

![Image](/assets//portfolio/mattermost/screen0.png)

The company had used Skype for over a decade for internal and external communication. At one point we just had enough of the lack of stability and limitations on uploaded attachments that came with Skype. After researching alternatives we settled on Mattermost as the new tool for communication. The team needs to send large video files for previewing and iteration so if we host our own server we can set the limitiations that make sense for our usecase.

My responsibility was to setup the Mattermost server and the reverse proxy to expose it to the internet on a bare-metal linux machine.

## Solution

I was already well acquainted with using linux at that point. I started with setting up a software raid1 for the database and attachment storage device to have data storage redundancy. The backup solution was to copy the database, attachments and some config files to another on premise server periodically. Ideally an offsite backup should also be setup for extra redundancy.

PostgresQL server setup was a bit tedious mainly because of it requiring very strict and specific directory persmission to work.

After that I could just install the required packages and configure Mattermost according to it's documentation which was very well put together.

We were happy with Mattermost service after testing it for a few days over the office LAN network.

Our office has a static public IP setup, so I could just create a new subdomain under the company domain and create the router rules to direct that traffic to the linux server.

I also had to create the Nginx reverse proxy configuration and use CertBot to enable https communication which was required by Mattermost to function correctly.

## Present

We have been using Mattermost for a few months now and are very pleased with it. It enables us to send any size attachments easily and create custom communication channels for every project. Adding clients or freelancers to specific communication channels is also very simple and stable.