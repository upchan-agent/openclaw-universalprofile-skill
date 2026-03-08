# Example Metadata Files

These are **template files** for use with `up profile update` and `up grid update` commands.

## How to Use

### 1. Replace Placeholder Values

**profile.json:**
- `name` - Your profile name
- `description` - Your bio/description
- `links` - Your social links (Twitter, website, etc.)
- `tags` - Relevant tags for your profile
- `profileImage[].url` - Replace `ipfs://QmYourImageCIDHere` with your actual IPFS CID
- `backgroundImage[].url` - Replace with your background image CID
- `ownerUP` - Your Universal Profile address

**grid.json:**
- `title` - Your grid title
- `grid[].properties` - Customize text, colors, images
- Image URLs - Replace `ipfs://QmYourImageCIDHere` with actual CIDs

### 2. Upload Images to IPFS

Before updating your profile, upload your images to IPFS:

```bash
# Using Pinata CLI or web interface
# Get the CID after upload
```

### 3. Compute Hash (Optional but Recommended)

For each image, compute the keccak256 hash:

```javascript
const hash = ethers.keccak256(ethers.toUtf8Bytes(imageContent));
```

### 4. Run the Update Command

```bash
export PINATA_API_KEY=your-key
export PINATA_SECRET=your-secret

up profile update --up 0xYourUP --key 0xYourKey --json profile.json
up grid update --up 0xYourUP --key 0xYourKey --json grid.json
```

## Notes

- All `ipfs://Qm...` placeholders must be replaced with actual CIDs
- Image hashes should match the actual image content
- The update command will automatically:
  1. Upload JSON to IPFS
  2. Compute the correct hash
  3. Build VerifiableURI
  4. Update on-chain

## Example Structure

### Profile Image Object
```json
{
  "width": 1024,
  "height": 1024,
  "hashFunction": "keccak256(bytes)",
  "hash": "0xb5ffa44a59418b5a1a1af335b72602e6b6532821ab6dbf0b45e13c70a3f15bfe",
  "url": "ipfs://QmActualCIDHere"
}
```

### Grid Item Types
- `TEXT` - Text content with custom colors
- `IMAGES` - Image gallery
- `IFRAME` - Embedded web content
- `X` - Twitter/X post embed
- `INSTAGRAM` - Instagram embed
- `QR_CODE` - QR code display

See SKILL.md for full documentation.
