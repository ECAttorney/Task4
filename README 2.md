# Geosoftware


For the page to work correct, you have to press the buttons in the order(get user location -> refresh -> nearby stations)
If you press the button nearby stations first, a default point is being used for the location of the user


I encountered two problems in my solution.

1: when i press the "get user location" button sometimes it takes a long time until it actually writes the GeoJSON string into the textfield, which doesnt hurt the further code, but it is quiet annoying and i dont know how to fix it. Also this button doesnt work with safari for some reason, but when working with chrome, everything went alright.

2: for the second table I could not figure out how to print out only the nearest element from the Array. I know that it should be easy code to just search for the element with the shortest distance, but i did not work. So
I decided to print the entire table out on the page.