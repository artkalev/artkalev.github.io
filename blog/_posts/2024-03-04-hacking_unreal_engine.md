---
layout: post
title:  "Hacking Unreal Engine"
date:   2024-03-04 12:00:00 +0200
---

I feel there is not enough information on Unreal Engine development on the internet. After a few years of building a few projects as part of my job I began to see why. People are probably too busy solving their problems to have time and/or energy to document or broadcast it. Which is understandable, there are just so many hours in a day after all...

## The Problem
I needed to use the USDImporter plugin to import pixar's OpenUSD formatted 3D scene files during runtime in a virtual reality project. Everything seemed to work well at first when running it in the editor. Only after I made a test packaged build of the project I noticed a problem. Imported meshes did not have any collision :O

## Shock
How could this be? The imported meshes were visible in the packaged build and when running the program in Unreal Editor the collisions were working. It seemed so weird to me that the graphics were working as intended but collision was not.

## Denial
Surely this kind of a bug would be documented and solved by now(year 2024). No such luck, I did not find any information on the problem at hand I did not have time to post on a forum and wait for response.

## Anger
Why the \*\*\*\* would there be visible graphics data but no collision when running the project in packaged build?! That's fucked up, I mean the geometry data is right there, visible so why no collision?!

## Bargaining
The only thing I could bargain in this situation was my time. So I reluctantly started to shift throug the source code of Unreal Engine's UStaticMesh class and the OpenUSD importer plugin to find any way to get the collision data to work in the packaged build.

## Depression
I went through a cycle of finding some promising method or property on some related class, utilizing it only to realize that any given method I tried just was not designed to work in a packaged build of an Unreal Engine project. There is a lot of functionality that is behing a #if WITH_EDITOR in Unreal Engine.
 - Reading Mesh data after the mesh has been constructed: blocked unless running in editor.
 - Getting Mesh data from render data: also blocked outside editor.
 - Setting flags and props: no effect after the UStaticMesh has been construced already.

Everything related to the actual geometry data seemed to be blocked when running in the packaged runtime environment. I felt like hitting a wall.

## Reconstruction
After failing at every method I could think of to solve the problem, I finally begrudgingly started to think about modifying the source code of the USD importer pluging. Modifying the plugin code is not ideal because this will result in a "custom" Unreal Engine build being a dependence of the project, meaning the project would not compile when using a standard release of the engine. But at this point I had already spent so much time on this that I could just not spend more. I needed a solution no matter what.

## Acceptance
I modified the plugin source code so that the geometry data would be passed into the UStaticMesh instance as subclass of UUserAssetData. This gave me geometry data that I could access during packaged runtime of the project. From there it was trivial to build collision mesh from the data during runtime. All I had to do to achieve this was to modify the source code of the engine plugin.

## Bitter Victory
It was a bitter victory: on one hand I solved the problem I had, but on the second the cost was double the memory usage in runtime because of the storage of extra geometry data and being bound to a modified custom "version" of the Unreal Engine.
So this made collisions work in the packaged build, but it just feels so wrong to solve it this way.

## Future
Honestly I don't know if future me would be happy or depressed when the new version of the engine fixes this issue. Sure I solved it and gained a lot of knowledge about the inner workings of the Unreal Engine in the process. But when this this issue gets solved in the time frame of the project, all my effort would essentially be a waste.
Anyway, I will try to make sure to notify the Unreal Engine development team about the issue with using OpenUSD Importer plugin during packaged runtime.