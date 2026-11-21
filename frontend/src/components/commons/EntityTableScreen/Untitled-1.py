greeting=input("=====TXT ADVENTURE=====\n Whats your name traveler? ")

start_game=input(f"Welcome {greeting}, are you ready to start? y/n: ").lower()
if start_game=="y" or start_game== "yes":
    direction=input("Great!\n Currently you are inside a forest. do you go N/S/W/E: ").lower()

    if direction=="n":
        house_poi=input("You walk north...\n You stumble upon an abandond house in the forest.\n do you go inside? or continue walking north. Continue or enter: ")
        print(house_poi)


    elif direction=="s":
        monster_poi=input("You walk south...\n You meet a scary monster.\n do you risk the fight or run away? fight/run: ")
        if monster_poi=="run":
            trader_poi=input("Good choice!\n there is no way you would have won that..\n as you are running you meet a merchant selling goods\n do you wanna go trade or walk south? trade/walk: ")
            if trader_poi=="trade":
                trading=input("what do you wanna buy boy? a sword or hp? hp/sword: ")