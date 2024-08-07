'use client';

import React, { useState, useEffect } from 'react';
import {
  AppBar, Box, Button, Divider, Fab, Modal, Stack, TextField, Toolbar, Typography, IconButton,
  Drawer, List, ListItem, ListItemIcon, ListItemText, Grid, FormControl, InputLabel, Select,
  MenuItem, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  collection, deleteDoc, doc, getDoc, getDocs, query, setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, firestore, storage, googleProvider } from '@/firebase'; // Ensure this is the correct path to your Firebase config
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AccountCircle from '@mui/icons-material/AccountCircle'; // For login icon

const Page = () => {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentItemId, setCurrentItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [measurement, setMeasurement] = useState('');
  const [location, setLocation] = useState('');
  const [searchItem, setSearchItem] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState('');
  const [defaultImageUrl, setDefaultImageUrl] = useState('');

  useEffect(() => {
    updateInventory();
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  useEffect(() => {
    const fetchDefaultImage = async () => {
      const defaultImageRef = ref(storage, 'https://firebasestorage.googleapis.com/v0/b/shelf-aware.appspot.com/o/images%2FdefaultImage.jpg?alt=media&token=9154c1fd-e8ea-4c42-ae69-6c52cdb3e438'); // Adjust the path as needed
      try {
        const url = await getDownloadURL(defaultImageRef);
        setDefaultImageUrl(url);
      } catch (error) {
        console.error('Failed to fetch default image', error);
      }
    };

    fetchDefaultImage();
  }, []);

  const handleGoogleAuth = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setAuthOpen(false); // Close the dialog on successful authentication
    } catch (error) {
      console.error('Google Authentication Error:', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  const updateInventory = async () => {
    const q = query(collection(firestore, 'inventory'));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setInventory(items);
  };

  const saveItem = async () => {
    let imageUrl = '';
    if (imageFile) {
      const imageRef = ref(storage, `images/${itemName}-${Date.now()}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
    }

    const itemRef = doc(firestore, 'inventory', itemName || `${Date.now()}`);
    const itemSnapshot = await getDoc(itemRef);

    if (editMode) {
      await setDoc(itemRef, {
        quantity: parseInt(quantity, 10),
        measurement,
        location,
        imageUrl: imageUrl || itemSnapshot.data()?.imageUrl
      }, { merge: true });
    } else {
      if (itemSnapshot.exists()) {
        await setDoc(itemRef, {
          quantity: (itemSnapshot.data().quantity || 0) + parseInt(quantity, 10),
          measurement: measurement || itemSnapshot.data().measurement,
          location: location || itemSnapshot.data().location,
          imageUrl: imageUrl || itemSnapshot.data().imageUrl
        }, { merge: true });
      } else {
        await setDoc(itemRef, {
          name: itemName,
          quantity: parseInt(quantity, 10),
          measurement,
          location,
          imageUrl
        });
      }
    }
    updateInventory();
    handleClose();
  };

  const removeItem = async (id) => {
    await deleteDoc(doc(firestore, 'inventory', id));
    updateInventory();
  };

  const handleOpen = (edit = false, item = {}) => {
    setEditMode(edit);
    setCurrentItemId(item.id || '');
    setItemName(item.name || '');
    setQuantity(item.quantity ? item.quantity.toString() : '');
    setMeasurement(item.measurement || '');
    setLocation(item.location || '');
    setImageFile(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentItemId('');
    setItemName('');
    setQuantity('');
    setMeasurement('');
    setLocation('');
    setImageFile(null);
    setEditMode(false);
  };

  const handleConfirmOpen = (id) => {
    setItemToDelete(id);
    setConfirmOpen(true);
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
    setItemToDelete('');
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      removeItem(itemToDelete);
      handleConfirmClose();
    }
  };

  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <AppBar sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundImage: "url('/assets/pantry_bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: '0.9'
      }}>
        <Toolbar>
          <Typography variant="h2" component="div" sx={{ flexGrow: 1, textShadow: '3px 3px 3px rgba(0, 0, 0, 1.0)', bgcolor: '#00000060' }}>
            |s|h|e|l|f| aware
          </Typography>
          {user ? (
            <IconButton color="inherit" onClick={handleLogout} sx={{ fontSize: 40 }}>
              <LogoutIcon sx={{ fontSize: 'inherit' }} />
            </IconButton>
          ) : (
            <IconButton color="inherit" onClick={() => setAuthOpen(true)} sx={{ fontSize: 40 }}>
              <AccountCircle sx={{ fontSize: 'inherit' }} />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Dialog open={authOpen} onClose={() => setAuthOpen(false)}>
        <DialogTitle>Login</DialogTitle>
        <DialogContent>
          <Button onClick={handleGoogleAuth} variant="contained" color="primary" fullWidth>
            Sign in with Google
          </Button>
        </DialogContent>
      </Dialog>

      {/* Spacer for AppBar */}
      <Toolbar />

      {/* Main page content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          width: '100vw',
          flexGrow: 1,
          marginTop: '64px',
          overflow: 'auto',
        }}
      >
        {/* Navigation Rail */}
        <Drawer
          variant="permanent"
          sx={{
            width: 200,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 200,
              boxSizing: 'border-box',
              backgroundColor: '#186F6580',
              marginTop: '64px',
            },
          }}
        >
          <Toolbar />
          <List>
            <ListItem button>
              <ListItemIcon>
                <FormatListBulletedIcon />
              </ListItemIcon>
              <ListItemText primary="Create Shopping List" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Drawer>

        {/* Inventory Sections */}
        <Stack sx={{ textAlign: 'left', padding: 2, flexGrow: 1, overflow: 'auto' }}>
          <TextField
            label="Search:"
            variant="outlined"
            sx={{
              width: '99%',
              marginBottom: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '24px',
              },
            }}
            value={searchItem}
            onChange={(e) => {
              setSearchItem(e.target.value);
            }}
          />

          <Typography variant="h5" marginTop={2}>
            Pantry
            <Divider />
          </Typography>
          <Stack
            minHeight={inventory.filter(item => item.location === 'Pantry' && item.name.toLowerCase().includes(searchItem.toLowerCase())).length > 0 ? '280px' : '80px'}
            spacing={2}
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            flexWrap="wrap"
            padding={1}
          >
            {inventory
              .filter(
                (item) =>
                  item.location === 'Pantry' &&
                  item.name.toLowerCase().includes(searchItem.toLowerCase())
              )
              .map(({ name, quantity, measurement, imageUrl }) => (
                <Box
                  key={name}
                  width="180px"
                  minHeight="100px"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  bgcolor="#B5CB9940"
                  borderRadius="16px"
                  padding={2}
                  margin={1}
                >
                  {imageUrl && (
                    <img
                      src={imageUrl || defaultImageUrl} // Use the fetched default image URL as a fallback
                      alt={`${name} image`}
                      style={{ width: '100%', borderRadius: '8px', marginBottom: '8px' }}
                    />
                  )}
                  <Typography
                    variant="h6"
                    color="#333"
                    textAlign="left"
                    sx={{ marginBottom: 1 }}
                  >
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                    <Divider />
                  </Typography>
                  <Typography
                    color="#333"
                    textAlign="left"
                    sx={{ marginBottom: 1 }}
                  >
                    Quantity: {quantity} {measurement}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" width="100%">
                    <Button variant="outlined" onClick={() => handleOpen(true, { name, quantity, measurement, location: 'Pantry', imageUrl })}>
                      <EditIcon />
                    </Button>
                    <Button variant="outlined" onClick={() => handleConfirmOpen(name)}>
                      <DeleteForeverIcon />
                    </Button>
                  </Box>
                </Box>
              ))}
          </Stack>

          <Typography variant="h5" marginTop={2}>
            Refrigerator
            <Divider />
          </Typography>
          <Stack
            minHeight={inventory.filter(item => item.location === 'Refrigerator' && item.name.toLowerCase().includes(searchItem.toLowerCase())).length > 0 ? '280px' : '80px'}
            spacing={2}
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            flexWrap="wrap"
            padding={1}
          >
            {inventory
              .filter(
                (item) =>
                  item.location === 'Refrigerator' &&
                  item.name.toLowerCase().includes(searchItem.toLowerCase())
              )
              .map(({ name, quantity, measurement, imageUrl }) => (
                <Box
                  key={name}
                  width="180px"
                  minHeight="100px"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  bgcolor="#B5CB9940"
                  borderRadius="16px"
                  padding={2}
                  margin={1}
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={`${name} image`}
                      style={{ width: '100%', borderRadius: '8px', marginBottom: '8px' }}
                    />
                  )}
                  <Typography
                    variant="h6"
                    color="#333"
                    textAlign="left"
                    sx={{ marginBottom: 1 }}
                  >
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Typography
                    color="#333"
                    textAlign="left"
                    sx={{ marginBottom: 1 }}
                  >
                    Quantity: {quantity} {measurement}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" width="100%">
                    <Button variant="outlined" onClick={() => handleOpen(true, { name, quantity, measurement, location: 'Refrigerator', imageUrl })}>
                      <EditIcon />
                    </Button>
                    <Button variant="outlined" onClick={() => handleConfirmOpen(name)}>
                      <DeleteForeverIcon />
                    </Button>
                  </Box>
                </Box>
              ))}
          </Stack>

          <Typography variant="h5" marginTop={2}>
            Freezer
            <Divider />
          </Typography>
          <Stack
            minHeight={inventory.filter(item => item.location === 'Freezer' && item.name.toLowerCase().includes(searchItem.toLowerCase())).length > 0 ? '280px' : '100px'}
            spacing={2}
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            flexWrap="wrap"
            padding={1}
          >
            {inventory
              .filter(
                (item) =>
                  item.location === 'Freezer' &&
                  item.name.toLowerCase().includes(searchItem.toLowerCase())
              )
              .map(({ name, quantity, measurement, imageUrl }) => (
                <Box
                  key={name}
                  width="180px"
                  minHeight="100px"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  bgcolor="#B5CB9940"
                  borderRadius="16px"
                  padding={2}
                  margin={1}
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={`${name} image`}
                      style={{ width: '100%', borderRadius: '8px', marginBottom: '8px' }}
                    />
                  )}
                  <Typography
                    variant="h6"
                    color="#333"
                    textAlign="left"
                    sx={{ marginBottom: 1 }}
                  >
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Typography
                    color="#333"
                    textAlign="left"
                    sx={{ marginBottom: 1 }}
                  >
                    Quantity: {quantity} {measurement}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" width="100%">
                    <Button variant="outlined" onClick={() => handleOpen(true, { name, quantity, measurement, location: 'Freezer', imageUrl })}>
                      <EditIcon />
                    </Button>
                    <Button variant="outlined" onClick={() => handleConfirmOpen(name)}>
                      <DeleteForeverIcon />
                    </Button>
                  </Box>
                </Box>
              ))}
          </Stack>
        </Stack>
      </Box>
      {/* Closing the Box before the Container */}

      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={600}
          bgcolor="white"
          border="2px solid #186F65"
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{
            transform: 'translate(-50%, -50%)',
            borderRadius: '16px',
          }}
        >
          <Grid container rowSpacing={2} columnSpacing={2}>
            <Grid item xs={12}>
              <Typography variant="h5">{editMode ? 'Edit Item' : 'Add New Item'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Item Name:"
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => {
                  setItemName(e.target.value);
                }}
                disabled={editMode} // Disable name editing in edit mode
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Quantity:"
                variant="outlined"
                fullWidth
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Measurement:"
                variant="outlined"
                fullWidth
                value={measurement}
                onChange={(e) => {
                  setMeasurement(e.target.value);
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="location-label">Location</InputLabel>
                <Select
                  labelId="location-label"
                  id="location-select"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  label="Location"
                >
                  <MenuItem value="Pantry">Pantry</MenuItem>
                  <MenuItem value="Refrigerator">Refrigerator</MenuItem>
                  <MenuItem value="Freezer">Freezer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center" alignItems="center">
                {/* Hidden file input */}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="file-upload"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
                {/* Camera icon button */}
                <label htmlFor="file-upload" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <IconButton color="primary" component="span">
                    <CameraAltIcon />
                  </IconButton>
                  <Typography variant="body2" style={{ marginLeft: 8 }}>
                    {imageFile ? imageFile.name : 'Upload Image'}
                  </Typography>
                </label>
              </Box>
            </Grid>

            <Grid item xs={12} container justifyContent="center">
              <Button
                variant="outlined"
                onClick={saveItem}
                style={{ width: '80%' }} // Optional: set a specific width if desired
              >
                {editMode ? 'Save Changes' : 'Add'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={handleConfirmClose}>
        <DialogTitle>Confirm Removal</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this item?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => handleOpen(false)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default Page;