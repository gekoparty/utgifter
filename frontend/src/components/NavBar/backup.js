 {/* <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
  {['Utgift', 'Kategori', 'Butikk', 'Merke'].map((text, index) => (
    <ListItem key={text} disablePadding sx={{ display: 'block' }}>
      <ListItemButton
        component={Link}
        to={text === 'Utgift' ? '/testroute1' : text === 'Kategori' ? '/testroute2' : text === 'Butikk' ? '/add-shop' : '/add-brand'}
        sx={{
          minHeight: 48,
          justifyContent: open ? 'initial' : 'center',
          px: 2.5,
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: open ? 3 : 'auto',
            justifyContent: 'center',
          }}
        >
          {index === 0 ? <AddCircleIcon /> : null}
          {index === 1 ? <AddCircleOutlineIcon /> : null}
          {index === 2 ? <AddLocationIcon /> : null}
          {index === 3 ? <DeleteIcon /> : null}
        </ListItemIcon>
        <ListItemText primary={text} sx={{ opacity: open ? 1 : 0 }} />
      </ListItemButton>
    </ListItem>
  ))}
</List>
        <Divider />
        <List>
          {['Alle Utgifter', 'Søk', 'Slett'].map((text, index) => (
            <ListItem key={text} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                </ListItemIcon>
                <ListItemText primary={text} sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer> */}