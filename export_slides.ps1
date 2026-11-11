try {
    $ppt = New-Object -ComObject PowerPoint.Application
    $pres = $ppt.Presentations.Open('C:\Users\Temp\Desktop\Travellers_Inn_Sense_5Min_Presentation.pptx', [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    
    $pres.Slides.Item(3).Export('C:\Users\Temp\Desktop\New folder\travellers-inn-sense\slide3_preview.png', 'PNG', 1280, 720)
    $pres.Slides.Item(5).Export('C:\Users\Temp\Desktop\New folder\travellers-inn-sense\slide5_preview.png', 'PNG', 1280, 720)
    $pres.Slides.Item(6).Export('C:\Users\Temp\Desktop\New folder\travellers-inn-sense\slide6_preview.png', 'PNG', 1280, 720)
    
    $pres.Close()
    $ppt.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
    Write-Output "All preview slides generated successfully"
} catch {
    Write-Output "Error: $($_.Exception.Message)"
}
