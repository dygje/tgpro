"""
Migration utility to migrate data from files to MongoDB
"""
import os
import json
import asyncio
from pathlib import Path
from typing import List, Dict, Any
from services.db_service import DatabaseService
from services.encryption_service import EncryptionService
import logging

logger = logging.getLogger(__name__)

class DataMigration:
    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service
        self.backend_dir = Path("/app/backend")
        
    async def migrate_groups_from_file(self) -> bool:
        """Migrate groups from groups.txt to MongoDB"""
        try:
            groups_file = self.backend_dir / "groups.txt"
            
            if not groups_file.exists():
                logger.warning("groups.txt not found, skipping groups migration")
                return True
            
            # Read existing groups from file
            file_groups = []
            with open(groups_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        file_groups.append(line)
            
            if not file_groups:
                logger.info("No groups found in groups.txt")
                return True
            
            # Get existing groups from MongoDB
            db_groups = await self.db_service.get_groups()
            
            # Migrate groups that don't exist in MongoDB
            migrated_count = 0
            for group_link in file_groups:
                if group_link not in db_groups:
                    success = await self.db_service.add_group(
                        group_link,
                        {"migrated_from": "groups.txt", "migration_date": "2025-01-01"}
                    )
                    if success:
                        migrated_count += 1
                        logger.info(f"Migrated group: {group_link}")
                    else:
                        logger.error(f"Failed to migrate group: {group_link}")
                else:
                    logger.info(f"Group already exists in MongoDB: {group_link}")
            
            logger.info(f"Groups migration completed. Migrated {migrated_count} groups")
            return True
            
        except Exception as e:
            logger.error(f"Error migrating groups: {e}")
            return False
    
    async def migrate_messages_from_files(self) -> bool:
        """Migrate message files to MongoDB as templates"""
        try:
            messages_dir = self.backend_dir / "messages"
            
            if not messages_dir.exists():
                logger.warning("messages/ directory not found, skipping messages migration")
                return True
            
            # Find all .txt files in messages directory
            message_files = list(messages_dir.glob("*.txt"))
            
            if not message_files:
                logger.info("No message files found in messages/ directory")
                return True
            
            # Get existing templates from MongoDB
            db_messages = await self.db_service.get_messages()
            existing_template_ids = [msg["template_id"] for msg in db_messages]
            
            # Migrate message files that don't exist in MongoDB
            migrated_count = 0
            for message_file in message_files:
                template_id = message_file.stem  # filename without extension
                
                if template_id not in existing_template_ids:
                    try:
                        # Read message content
                        with open(message_file, 'r', encoding='utf-8') as f:
                            content = f.read().strip()
                        
                        if not content:
                            logger.warning(f"Empty message file: {message_file}")
                            continue
                        
                        # Extract variables from content (simple template variable detection)
                        variables = self._extract_template_variables(content)
                        
                        # Add to MongoDB
                        success = await self.db_service.add_message(
                            template_id,
                            content,
                            variables
                        )
                        
                        if success:
                            migrated_count += 1
                            logger.info(f"Migrated message template: {template_id}")
                        else:
                            logger.error(f"Failed to migrate message template: {template_id}")
                    except Exception as e:
                        logger.error(f"Error reading message file {message_file}: {e}")
                else:
                    logger.info(f"Template already exists in MongoDB: {template_id}")
            
            logger.info(f"Messages migration completed. Migrated {migrated_count} templates")
            return True
            
        except Exception as e:
            logger.error(f"Error migrating messages: {e}")
            return False
    
    def _extract_template_variables(self, content: str) -> Dict[str, List[str]]:
        """Extract template variables from message content"""
        import re
        
        # Find variables in {{ variable }} format
        pattern = r'\{\{\s*(\w+)\s*\}\}'
        matches = re.findall(pattern, content)
        
        variables = {}
        for var in set(matches):  # Remove duplicates
            # Provide default values for common variables
            if var == "name":
                variables[var] = ["Friend", "Buddy", "There"]
            elif var == "current_date":
                variables[var] = ["today", "this date"]
            elif var == "current_time":
                variables[var] = ["now", "this time"]
            else:
                variables[var] = ["default_value"]
        
        return variables
    
    async def migrate_blacklists_from_files(self) -> bool:
        """Migrate blacklist files to MongoDB"""
        try:
            blacklists_dir = self.backend_dir / "blacklists"
            
            if not blacklists_dir.exists():
                logger.warning("blacklists/ directory not found, skipping blacklists migration")
                return True
            
            # Check for permanent and temporary blacklist files
            permanent_file = blacklists_dir / "permanent_blacklist.txt"
            temporary_file = blacklists_dir / "temporary_blacklist.txt"
            
            migrated_count = 0
            
            # Migrate permanent blacklist
            if permanent_file.exists():
                with open(permanent_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            success = await self.db_service.add_to_blacklist(
                                line, "permanent", "Migrated from file"
                            )
                            if success:
                                migrated_count += 1
                                logger.info(f"Migrated permanent blacklist entry: {line}")
            
            # Migrate temporary blacklist  
            if temporary_file.exists():
                with open(temporary_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            success = await self.db_service.add_to_blacklist(
                                line, "temporary", "Migrated from file"
                            )
                            if success:
                                migrated_count += 1
                                logger.info(f"Migrated temporary blacklist entry: {line}")
            
            logger.info(f"Blacklists migration completed. Migrated {migrated_count} entries")
            return True
            
        except Exception as e:
            logger.error(f"Error migrating blacklists: {e}")
            return False
    
    async def run_full_migration(self) -> Dict[str, bool]:
        """Run complete data migration from files to MongoDB"""
        results = {}
        
        logger.info("Starting full data migration from files to MongoDB...")
        
        # Migrate groups
        logger.info("Migrating groups...")
        results["groups"] = await self.migrate_groups_from_file()
        
        # Migrate messages
        logger.info("Migrating message templates...")
        results["messages"] = await self.migrate_messages_from_files()
        
        # Migrate blacklists
        logger.info("Migrating blacklists...")
        results["blacklists"] = await self.migrate_blacklists_from_files()
        
        logger.info("Migration completed")
        logger.info(f"Migration results: {results}")
        
        return results
    
    async def verify_migration(self) -> Dict[str, Any]:
        """Verify that migration was successful"""
        try:
            verification = {}
            
            # Verify groups
            db_groups = await self.db_service.get_groups()
            verification["groups_in_db"] = len(db_groups)
            
            # Count groups in file
            groups_file = self.backend_dir / "groups.txt"
            file_groups_count = 0
            if groups_file.exists():
                with open(groups_file, 'r') as f:
                    for line in f:
                        if line.strip() and not line.startswith('#'):
                            file_groups_count += 1
            verification["groups_in_file"] = file_groups_count
            
            # Verify messages
            db_messages = await self.db_service.get_messages()
            verification["messages_in_db"] = len(db_messages)
            
            # Count message files
            messages_dir = self.backend_dir / "messages"
            file_messages_count = 0
            if messages_dir.exists():
                file_messages_count = len(list(messages_dir.glob("*.txt")))
            verification["messages_in_files"] = file_messages_count
            
            # Verify blacklists
            db_blacklists = await self.db_service.get_blacklists()
            verification["blacklists_in_db"] = {
                "permanent": len(db_blacklists["permanent"]),
                "temporary": len(db_blacklists["temporary"])
            }
            
            return verification
            
        except Exception as e:
            logger.error(f"Error verifying migration: {e}")
            return {"error": str(e)}

# Standalone migration script
async def main():
    """Run migration as standalone script"""
    logging.basicConfig(level=logging.INFO)
    
    # Initialize database service
    db_service = DatabaseService()
    
    # Connect to database
    if not await db_service.connect():
        print("Failed to connect to database")
        return
    
    # Run migration
    migration = DataMigration(db_service)
    results = await migration.run_full_migration()
    
    print("Migration Results:")
    for key, success in results.items():
        status = "✅" if success else "❌"
        print(f"{status} {key}: {success}")
    
    # Verify migration
    verification = await migration.verify_migration()
    print("\nVerification Results:")
    print(json.dumps(verification, indent=2))
    
    # Disconnect
    await db_service.disconnect()

if __name__ == "__main__":
    asyncio.run(main())